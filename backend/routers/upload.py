from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from .. import models
import csv
import io
from datetime import datetime
import asyncio
from ..services.cache_service import cache_service

router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"],
)

@router.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    import traceback
    log_trace(f"Start Analysis: {file.filename}")
    try:
        if not file.filename.endswith('.csv'):
            log_trace("Invalid File: Not CSV")
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        log_trace("Reading Content for Analysis")
        content = await file.read()
        log_trace(f"Analysis Read OK. Bytes: {len(content)}")
        
        from ..services.data_processing import data_processor
        log_trace("Service imported. Calling analyze_dataset...")
        
        analysis = await data_processor.analyze_dataset(content, file.filename)
        log_trace(f"Analysis Result Received: {list(analysis.keys()) if isinstance(analysis, dict) else 'Invalid Type'}")
        
        if "error" in analysis:
             log_trace(f"Analysis Error: {analysis['error']}")
             raise HTTPException(status_code=400, detail=analysis["error"])
             
        log_trace("Analysis Success")
        return analysis
    except Exception as e:
        err_msg = f"CRITICAL ANALYSIS ERROR: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        log_trace(f"ANALYSIS EXCEPTION: {err_msg}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug Trace Helper
def log_trace(msg):
    try:
        with open("debug_trace.txt", "a") as f:
            f.write(f"{datetime.now()}: {msg}\n")
    except:
        pass

@router.post("/csv")
async def upload_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    log_trace(f"Start Upload: {file.filename}")
    if not file.filename.endswith('.csv'):
        log_trace("Invalid File: Not CSV")
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    try:
        log_trace("Reading File Content")
        content = await file.read()
        log_trace(f"File Read OK. Bytes: {len(content)}")
        
        text_content = None
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        
        for encoding in encodings:
            try:
                text_content = content.decode(encoding)
                log_trace(f"Decoded with {encoding}")
                break
            except UnicodeDecodeError:
                continue
                
        if text_content is None:
            log_trace("Decoding Failed")
            raise HTTPException(status_code=400, detail="Unable to decode file. Please use a standard CSV encoding (UTF-8 or Latin-1).")
        
        log_trace("Parsing CSV with Pandas for Auto-Cleaning")
        import pandas as pd
        
        # Load into DataFrame
        df = pd.read_csv(io.StringIO(text_content))
        
        # 1. Standardize Headers
        df.columns = [str(c).strip() for c in df.columns]
        headers = [h.lower().strip() for h in df.columns]
        
        # 2. Auto-Cleaning: Remove Duplicates
        initial_rows = len(df)
        df.drop_duplicates(inplace=True)
        duplicates_removed = initial_rows - len(df)
        log_trace(f"Cleaning: Removed {duplicates_removed} duplicate rows")
        
        # 3. Auto-Cleaning: Handle Missing Values
        # Verify critical columns before cleaning
        
        aliases = {
            'customer': ['customer name', 'customer', 'client', 'user', 'buyer', 'name', 'email'],
            'product': ['product name', 'product', 'item', 'sku', 'description', 'service', 'title', 'name'],
            'revenue': ['revenue', 'total amount', 'total', 'amount', 'sales', 'price', 'cost', 'value', 'current price'],
            'quantity': ['quantity', 'qty', 'units', 'count', 'vol', 'number of items'],
            'date': ['date', 'order date', 'timestamp', 'created at', 'time', 'day'],
            'category': ['category', 'type', 'group', 'department', 'class', 'cuisine', 'cuisines', 'food type', 'sector'],
            'region': ['region', 'city', 'location', 'area', 'country', 'state', 'zone', 'territory']
        }
        
        mapped_cols = {}
        original_labels = {"category": "Category", "region": "Region"}

        for key, alias_list in aliases.items():
            for header in headers:
                if header in alias_list or any(alias in header for alias in alias_list):
                     mapped_cols[key] = header
                     # Find exact original header from df.columns for label
                     actual_col = [c for c in df.columns if c.lower().strip() == header][0]
                     if key == 'category':
                         original_labels["category"] = actual_col
                     if key == 'region':
                         original_labels["region"] = actual_col
                     break
        
        # Save labels for frontend
        try:
            import json
            with open("dataset_config.json", "w") as f:
                json.dump({
                    "category_label": original_labels["category"], 
                    "region_label": original_labels["region"]
                }, f)
        except Exception as e:
            print(f"Failed to save dataset config: {e}")

        log_trace(f"Columns Mapped: {mapped_cols}")
    
        # We need at least Revenue and (Customer or Product) to be useful as "Sales Data"
        has_sales_data = 'revenue' in mapped_cols and ('customer' in mapped_cols or 'product' in mapped_cols)
        
        records_processed = 0
        
        if has_sales_data:
            log_trace("Sales Data Matched. Cleaning Data...")
            
            # fillna logic
            if 'customer' in mapped_cols:
                # Find the actual case-sensitive column name
                target_col = [c for c in df.columns if c.lower().strip() == mapped_cols['customer']][0]
                df[target_col] = df[target_col].fillna('Unknown Customer')
            
            if 'product' in mapped_cols:
                target_col = [c for c in df.columns if c.lower().strip() == mapped_cols['product']][0]
                df[target_col] = df[target_col].fillna('General Item')

            if 'revenue' in mapped_cols:
                 target_col = [c for c in df.columns if c.lower().strip() == mapped_cols['revenue']][0]
                 # Ensure numeric first
                 if df[target_col].dtype == object:
                     df[target_col] = df[target_col].astype(str).str.replace(r'[$,]', '', regex=True)
                 
                 # Convert to numeric, coercing errors to NaN
                 df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
                 
                 # Statistical Imputation: Use Median
                 median_rev = df[target_col].median()
                 if pd.isna(median_rev): median_rev = 0.0 # Fallback if empty
                 
                 missing_count = df[target_col].isna().sum()
                 if missing_count > 0:
                     df[target_col] = df[target_col].fillna(median_rev)
                     log_trace(f"Imputation: Filled {missing_count} missing revenue values with Median ({median_rev})")
                 else:
                     df[target_col] = df[target_col].fillna(0.0) # Safety
            
            if 'quantity' in mapped_cols:
                 target_col = [c for c in df.columns if c.lower().strip() == mapped_cols['quantity']][0]
                 df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
                 # Quantity Mode (most common) or Median is best. Mode usually 1.
                 mode_qty = df[target_col].mode()
                 fill_val = mode_qty[0] if len(mode_qty) > 0 else 1
                 df[target_col] = df[target_col].fillna(fill_val)

            # Drop completely empty rows
            df.dropna(how='all', inplace=True)
            
            log_trace("Data Cleaned. Converting to Records...")
            
            # --- PASS 1: Identify and Create New Entities (Customers & Products) ---
            log_trace("Pass 1: Extracting Entities")
            
            # Convert cleaned dataframe to Dict records for compatibility with existing logic
            rows = df.to_dict('records')
            total_rows = len(rows)
            log_trace(f"Total Cleaned Rows to Process: {total_rows}")
            
            # Optimization: Create O(1) Lookup Map for Columns
            # meaningful_headers_map = { 'customer': 'Customer Name' }
            
            final_col_map = {}
            # Need to re-map using the exact DataFrame columns
            df_cols_lower = {c.lower().strip(): c for c in df.columns}
            
            for key, target_lower in mapped_cols.items():
                if target_lower in df_cols_lower:
                    final_col_map[key] = df_cols_lower[target_lower]
            
            log_trace(f"Optimized Column Map: {final_col_map}")

            # Sets to track unique entities in this file
            unique_emails = set()
            unique_products = set()
            
            # Maps for "Email -> Name" and "Product -> (Price, Cost)"
            new_customer_data = {} 
            new_product_data = {}

            # Pre-compute keys for speed
            cust_key = final_col_map.get('customer')
            prod_key = final_col_map.get('product')
            rev_key = final_col_map.get('revenue')
            qty_key = final_col_map.get('quantity')
            date_key = final_col_map.get('date')
            cat_key = final_col_map.get('category')
            reg_key = final_col_map.get('region')


            
            # Helper for Date Parsing
            def try_parse_date(val):
                if not val: return datetime.now()
                val = str(val).strip()
                formats = [
                    "%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y", 
                    "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M"
                ]
                for fmt in formats:
                    try:
                        return datetime.strptime(val, fmt)
                    except:
                        continue
                return datetime.now()

            for row in rows:
                # Customer
                raw_name = row.get(cust_key)
                clean_name = str(raw_name).strip().title() if raw_name else "Unknown Customer"
                email = f"{clean_name.replace(' ', '.').lower()}@example.com"
                
                if email not in unique_emails:
                    unique_emails.add(email)
                    # Capture Region
                    raw_reg = row.get(reg_key)
                    clean_reg = str(raw_reg).strip().title() if raw_reg else "North America"
                    new_customer_data[email] = {"name": clean_name, "region": clean_reg}
                    
                # Product & Category
                raw_prod = row.get(prod_key)
                clean_prod = str(raw_prod).strip() if raw_prod else "General Item"
                
                raw_cat = row.get(cat_key)
                clean_cat = str(raw_cat).strip().title() if raw_cat else "General"
                
                if clean_prod not in unique_products:
                    unique_products.add(clean_prod)
                    # Infer price
                    try:
                        r_val = row.get(rev_key)
                        q_val = row.get(qty_key)
                        rev_s = float(str(r_val).replace('$','').replace(',','').strip()) if r_val else 0.0
                        qty_s = int(float(str(q_val).replace(',','').strip())) if q_val else 1
                        price = rev_s / qty_s if qty_s > 0 else 0
                    except:
                        price = 0
                    new_product_data[clean_prod] = {"price": price, "category": clean_cat}

            log_trace(f"Found {len(unique_emails)} unique customers, {len(unique_products)} unique products")

            # Load EXISTING from DB
            existing_cust_stmt = await db.execute(select(models.Customer).where(models.Customer.email.in_(unique_emails)))
            existing_prod_stmt = await db.execute(select(models.Product).where(models.Product.name.in_(unique_products)))
            
            # lookup maps: email -> ID
            customer_id_map = {c.email: c.id for c in existing_cust_stmt.scalars()}
            product_id_map = {p.name: p.id for p in existing_prod_stmt.scalars()}
            
            # Identify MISSING
            customers_to_add = []
            for email in unique_emails:
                if email not in customer_id_map:
                    c_data = new_customer_data[email]
                    customers_to_add.append(models.Customer(
                        name=c_data["name"],
                        email=email, 
                        region=c_data["region"]
                    ))
            
            products_to_add = []
            for pname in unique_products:
                if pname not in product_id_map:
                    p_data = new_product_data[pname]
                    # Handle if p_data is just price (backward compat) or dict
                    if isinstance(p_data, dict):
                         price = p_data["price"]
                         cat = p_data["category"]
                    else:
                         price = p_data
                         cat = "General"
                         
                    products_to_add.append(models.Product(
                        name=pname,
                        category=cat,
                        price=price,
                        cost=price * 0.7
                    ))
            
            # Bulk Insert Missing Entities
            if customers_to_add:
                db.add_all(customers_to_add)
                await db.flush() # Generate IDs
                for c in customers_to_add:
                    customer_id_map[c.email] = c.id
            
            if products_to_add:
                db.add_all(products_to_add)
                await db.flush() # Generate IDs
                for p in products_to_add:
                    product_id_map[p.name] = p.id
                    
            log_trace("Pass 1 Complete. All ID maps ready.")

            # --- PASS 2: Batch Insert Orders ---
            log_trace("Pass 2: Creating Orders")
            
            curr_batch_orders = []
            curr_batch_items = []
            
            BATCH_SIZE = 2000
            batch_count = 0
            
            for i, row in enumerate(rows):
                # O(1) Access
                raw_name = row.get(cust_key)
                cust_clean = str(raw_name).strip().title() if raw_name else "Unknown Customer"
                email = f"{cust_clean.replace(' ', '.').lower()}@example.com"
                
                raw_prod = row.get(prod_key)
                prod_clean = str(raw_prod).strip() if raw_prod else "General Item"
                
                try:
                    r_val = row.get(rev_key)
                    q_val = row.get(qty_key)
                    rev = float(str(r_val).replace('$','').replace(',','').strip()) if r_val else 0.0
                    qty = int(float(str(q_val).replace(',','').strip())) if q_val else 1
                except:
                    rev = 0.0
                    qty = 1
                
                price = rev / qty if qty > 0 else 0
                
                date_val = try_parse_date(row.get(date_key))

                cid = customer_id_map.get(email)
                pid = product_id_map.get(prod_clean)
                
                if not cid or not pid:
                    continue # Should not happen
                
                order = models.Order(
                    customer_id=cid,
                    total_amount=rev,
                    status="completed",
                    created_at=date_val
                )
                curr_batch_orders.append(order)
                curr_batch_items.append({
                    "order_ref": order, 
                    "product_id": pid,
                    "quantity": qty,
                    "price": price
                })
                
                records_processed += 1
                
                # Flush Batch?
                if len(curr_batch_orders) >= BATCH_SIZE:
                    batch_count += 1
                    # log_trace(f"Flushing Batch {batch_count}") # Reduce I/O
                    db.add_all(curr_batch_orders)
                    await db.flush() # Get Order IDs
                    
                    # Now create items
                    items_to_add = []
                    for item_data in curr_batch_items:
                        items_to_add.append(models.OrderItem(
                            order_id=item_data["order_ref"].id,
                            product_id=item_data["product_id"],
                            quantity=item_data["quantity"],
                            price_at_purchase=item_data["price"]
                        ))
                    
                    db.add_all(items_to_add)
                    await db.flush() # Flush items
                    
                    # Clear buffers
                    curr_batch_orders = []
                    curr_batch_items = []
            
            # Final Batch
            if curr_batch_orders:
                log_trace("Flushing Final Batch")
                db.add_all(curr_batch_orders)
                await db.flush()
                
                items_to_add = []
                for item_data in curr_batch_items:
                    items_to_add.append(models.OrderItem(
                        order_id=item_data["order_ref"].id,
                        product_id=item_data["product_id"],
                        quantity=item_data["quantity"],
                        price_at_purchase=item_data["price"]
                    ))
                db.add_all(items_to_add)
                await db.flush()

            log_trace("Final Commit Starting")
            await db.commit()
            log_trace("Final Commit Done")

            # CLEAR CACHE to ensure dash updates
            await cache_service.clear()
            log_trace("Cache Cleared")
            
            return {"message": "Sales Data Imported Successfully", "records_processed": records_processed, "type": "sales"}
        
    except Exception as e:
        import traceback
        err_msg = f"CRITICAL UPLOAD ERROR: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        log_trace(f"CRITICAL EXCEPTION: {err_msg}")
        with open("critical_error.log", "a") as f:
            f.write(err_msg)
            
        # Rollback any pending transaction
        try:
            await db.rollback()
        except:
            pass
            
        raise HTTPException(status_code=500, detail=f"Upload Error: {str(e)}")

@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a PDF file.")
    
    try:
        from pypdf import PdfReader
        from ..services import ai_service
        
        # Read PDF content
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Limit text for API processing
        text_preview = text[:5000] 
        
        # Analyze with AI
        prompt = f"""
        Analyze the following business document content and provide a strategic summary.
        Identify key risks, opportunities, or strategic shifts mentioned.
        
        Document Content:
        {text_preview}
        """
        
        insight_response = await ai_service.generate_business_insight(prompt)
        
        # Store as AI Insight
        new_insight = models.AIInsight(
            type="STRATEGY_DOC",
            title=f"Analysis: {file.filename}",
            content=insight_response.get("content", "Analysis failed"),
            confidence_score=0.9
        )
        db.add(new_insight)
        await db.commit()
        
        return {
            "message": "PDF Analysis Complete", 
            "insight": new_insight.content,
            "title": new_insight.title
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"PDF Processing Error: {str(e)}")
        
@router.delete("/clear")
async def clear_data(db: AsyncSession = Depends(get_db)):
    log_trace("Clear Data Request Received")
    try:
        from sqlalchemy import text
        # Order matters due to foreign keys
        await db.execute(text("TRUNCATE TABLE order_items RESTART IDENTITY CASCADE"))
        await db.execute(text("TRUNCATE TABLE orders RESTART IDENTITY CASCADE"))
        await db.execute(text("TRUNCATE TABLE products RESTART IDENTITY CASCADE"))
        await db.execute(text("TRUNCATE TABLE customers RESTART IDENTITY CASCADE"))
        await db.execute(text("TRUNCATE TABLE ai_insights RESTART IDENTITY CASCADE"))
        
        await db.commit()
        await cache_service.clear()
        
        log_trace("Database Cleared Successfully")
        return {"message": "All data cleared successfully"}
    except Exception as e:
        await db.rollback()
        log_trace(f"Clear Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")
