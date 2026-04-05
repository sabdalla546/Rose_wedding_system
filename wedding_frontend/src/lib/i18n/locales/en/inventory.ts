export const inventoryEn = {
  "sidebar": {
    "nav": {
      "inventory": "Inventory"
    }
  },
  "inventory": {
    "title": "Inventory",
    "description": "Manage standalone stock items, quantities, and optional catalog images.",
    "totalItems": "total items",
    "listTitle": "Inventory Items",
    "create": "Create Item",
    "createTitle": "Create Inventory Item",
    "editTitle": "Edit Inventory Item",
    "createDescription": "Add a standalone stock item with a direct quantity and optional reference image.",
    "editDescription": "Update the standalone stock item name, quantity, and reference image.",
    "backToInventory": "Back to Inventory",
    "basicInformation": "Basic Information",
    "basicInformationHint": "Capture the product name and the current on-hand quantity for this standalone catalog item.",
    "name": "Product Name",
    "namePlaceholder": "Enter product name",
    "quantity": "Quantity",
    "quantityPlaceholder": "Enter available quantity",
    "quantityHelper": "Use zero for items that are currently out of stock.",
    "image": "Image",
    "imageSection": "Reference Image",
    "imageSectionHint": "Upload an optional product image that helps the team identify this stock item quickly.",
    "imageUpload": "Upload Image",
    "imageHint": "Accepted image files only. Keep uploads under 5 MB for smoother syncing.",
    "imageMaxSize": "Maximum recommended size: 5 MB",
    "selectedImage": "Selected image",
    "preview": "Preview",
    "previewHint": "The selected image will appear in the inventory list and details view.",
    "noImage": "No image uploaded",
    "noImageHint": "Add an optional image to make the stock catalog easier to scan.",
    "imagePath": "Image Path",
    "stockStatus": "Stock Status",
    "currentQuantity": "Current quantity",
    "auditTrail": "Audit Trail",
    "auditTrailHint": "Track who created the item and when the catalog record was updated.",
    "createdBy": "Created By",
    "updatedBy": "Updated By",
    "createdAt": "Created At",
    "updatedAt": "Updated At",
    "searchPlaceholder": "Search inventory by product name...",
    "filterDescription": "Refine the stock catalog by product name and stock availability.",
    "stockFilter": "Stock Filter",
    "emptyTitle": "No inventory items yet",
    "emptyDescription": "Start your standalone stock catalog by creating the first item and adding its quantity and reference image.",
    "emptyAction": "Create First Item",
    "emptyFilteredTitle": "No matching inventory items",
    "emptyFilteredDescription": "Try changing the search term or stock filter to find matching items.",
    "deleteTitle": "Delete Inventory Item",
    "deleteMessage": "Are you sure you want to delete this inventory item?",
    "units_one": "unit",
    "units_other": "units",
    "filters": {
      "all": "All Items",
      "in-stock": "In Stock",
      "out-of-stock": "Out of Stock"
    },
    "status": {
      "inStock": "In Stock",
      "outOfStock": "Out of Stock"
    },
    "toast": {
      "created": "Inventory item created successfully",
      "createFailed": "Failed to create inventory item",
      "updated": "Inventory item updated successfully",
      "updateFailed": "Failed to update inventory item",
      "deleted": "Inventory item deleted successfully",
      "deleteFailed": "Failed to delete inventory item"
    },
    "validation": {
      "nameRequired": "Product name is required",
      "quantityRequired": "Quantity is required",
      "quantityInteger": "Quantity must be a whole number",
      "quantityMin": "Quantity cannot be negative"
    }
  }
} as const;
