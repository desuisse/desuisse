# How to add a product — DeSuisse admin guide

A simple step-by-step for adding products to the website. No code needed.

---

## Before you start

You'll need:
- A photo of the product (from your phone is fine — the system resizes
  it automatically)
- The product details: name, price, materials, sizes
- Your admin login

---

## Step 1: Log in

1. Open your browser and go to: **desuisse.com/admin**
2. Enter your admin name and your own password. The original login name is **Lorik**.
3. Click **Sign In**

If you get a "too many attempts" message, wait 15 minutes and try again.

## Add Naim or Arba as an admin (Lorik only)

1. Sign in at **desuisse.com/admin** as **Lorik** with the existing admin password.
2. Open **Administrators** in the left menu.
3. Enter **Naim** or **Arba**, choose a different password of at least 12 characters for each person, and click **Add administrator**.
4. Give each person their own login details privately. They enter their name and password on the same admin login page.

Only Lorik can add or remove admins. To revoke someone's access, click **Remove** beside their name; their active sessions stop working. Every product row shows **Published by**. Existing products show Lorik, and new products show the admin who first saves them. Editing a product does not change its publisher.

---

## Step 2: Open the Add Product form

1. Make sure the **Products** tab is selected at the top
2. Click the **+ Add Product** button (top right)

A form opens with all the fields you need to fill in.

---

## Step 3: Fill in the basics

| Field | What to put |
|---|---|
| **Name** | The product name in English (e.g. "Eternity Diamond Ring") |
| **Name — Shqip** | The same name in Albanian |
| **Category** | Pick from the list (Engagement Rings, Wedding Rings, etc.) |
| **Price** | The price in euros (just the number — no € symbol). For products with multiple materials, this is the base price. |
| **SKU** | Optional. Your internal product code if you use one. |

---

## Step 4: Add the photo

This is the new easy part! Find the **Main Image** section.

You'll see a dashed box that says **"Click or drop a photo here"**.

**Two ways to upload:**

**Way 1 — Click to pick:**
1. Click anywhere inside the dashed box
2. Your computer's file picker opens (or your phone's photo library on mobile)
3. Choose the product photo
4. Wait 5–15 seconds while it uploads
5. When done, you'll see the photo as a preview right in the form ✓

**Way 2 — Drag and drop (computer only):**
1. Open your file explorer next to the browser
2. Drag the photo into the dashed box
3. The box turns gold while you're hovering — that means "drop here"
4. Release the photo → it uploads

**What happens during upload:**
- A progress bar shows the upload percentage
- The photo gets automatically resized for the web (so even a huge 10 MB
  phone photo becomes a fast-loading web image)
- Cloudinary handles all the optimization in the background

**If the upload fails:**
- Red error text appears below the box
- Most common cause: the file is bigger than 10 MB (resize first)
- Second most common: the file isn't an image (only JPG, PNG, WEBP work)

**Hover image** (optional): the second photo shown when a customer hovers
their mouse over the product in the shop. Use this for a different angle
of the same product, or skip it.

---

## Step 5: Materials and prices

If the product comes in multiple metals (e.g. yellow gold AND white gold)
at different prices, use the **Material Variants** section:

1. Click **+ Add Material Variant**
2. Pick a material (e.g. "Yellow Gold")
3. Enter the price for that material
4. Click **+ Add Material Variant** again for the next material

If the product is only one material, you can skip this section.

---

## Step 6: Sizes

Tick the boxes for the sizes available (ring sizes 44–60, bracelet sizes
in cm, etc.).

For things like earrings or necklaces with a single size, leave all
boxes unticked.

---

## Step 7: Stones (rings only)

If the product has a gemstone:
- Tick which stones are available (Diamond, Lab Diamond, Moissanite)
- Tick which stone sizes are available

For plain rings or non-stone items, skip this section.

---

## Step 8: Description

Write a short description (1–3 sentences) of the product:
- In English, in the **Description** field
- In Albanian, in the **Description — Shqip** field

Examples:
- "Classic solitaire engagement ring with a brilliant cut diamond. Available in 14ct and 18ct gold."
- "Modern signet ring with intricate chain detail along the band. A statement piece for everyday wear."

---

## Step 9: Featured?

If you want this product to appear on the **homepage**, tick the
**Featured** checkbox. Otherwise it only shows in the Shop section.

Note: only tick this for your best products. If you tick everything,
the homepage stops feeling curated.

---

## Step 10: Save

Click **Save Product** (big dark button at the bottom).

You should see a green ✓ saved confirmation. The product appears
immediately at the top of the product list, and in the Shop section
on the website within seconds.

---

## If a save fails

You'll see an error dialog. Read what it says — it tells you exactly
what went wrong:

| Error | What to do |
|---|---|
| "Could not save to database" + something about Upstash | Tell your developer — the database isn't configured |
| "Unauthorized" | Your session timed out (2 hours). Log out and back in. |
| "Network error" | Check your internet connection, try again |
| Anything else | Take a screenshot and send it to your developer |

---

## Editing an existing product

1. Find the product in the list
2. Click the **Edit** button next to it
3. Change whatever needs changing (including replacing the photo — just
   click the dashed box again and pick a new one)
4. Click **Save Product**

The change goes live immediately on the website.

---

## Deleting a product

1. Find the product in the list
2. Click the **Delete** button (or trash icon)
3. Confirm in the popup
4. The product is gone from the website immediately

⚠ **There is no undo.** Make sure before clicking.

---

## Photo tips

- **Phone photos are fine** — the system resizes them automatically
- **Best background**: clean white, cream, or satin
- **Lighting**: bright but soft, no harsh shadows
- **Angle**: 3/4 view usually looks best for rings; flat for necklaces
- **Crop**: leave a little breathing space around the product
- **File size**: up to 10 MB is fine — the system optimises it down

---

## What gets shown where

When you add a product:

- It appears in the **Shop** page (under its category)
- If you ticked **Featured**: it also appears on the **Homepage** in
  the "Selected Gifts" section
- The category photo on the homepage doesn't change automatically —
  that's a separate setting in the **Site Images** tab

If your product doesn't appear on the website after saving:
1. Wait 30 seconds (sometimes there's a brief cache delay)
2. Hard-refresh the page (close the tab fully, reopen)
3. Check on a different device — sometimes your phone caches more
   aggressively than your laptop
