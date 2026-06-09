using RapidDev.Application.DTOs.Purchase;

namespace RapidDev.WebApi.Controllers.Purchase;

internal static class PurchaseValidation
{
    public static List<string> ValidateFilter(int pageNumber, int pageSize, DateTime? fromDate, DateTime? toDate, string? search)
    {
        List<string> errors = new List<string>();
        if (pageNumber <= 0) errors.Add("Page number must be greater than zero.");
        if (pageSize <= 0 || pageSize > 100) errors.Add("Page size must be between 1 and 100.");
        if (fromDate.HasValue && toDate.HasValue && fromDate.Value.Date > toDate.Value.Date)
            errors.Add("From date cannot be later than to date.");
        if (!string.IsNullOrWhiteSpace(search) && search.Length > 200)
            errors.Add("Search cannot exceed 200 characters.");
        return errors;
    }

    // Purchase Requisition

    public static List<string> Validate(CreatePurchaseRequisitionDto dto) =>
        ValidateRequisition(dto.Remarks, dto.Items);

    public static List<string> Validate(UpdatePurchaseRequisitionDto dto) =>
        ValidateRequisition(dto.Remarks, dto.Items);

    // Purchase Order

    public static List<string> Validate(CreatePurchaseOrderDto dto) =>
        ValidatePurchaseOrder(dto.TaxPercentage, dto.Remarks, dto.Items);

    public static List<string> Validate(UpdatePurchaseOrderDto dto) =>
        ValidatePurchaseOrder(dto.TaxPercentage, dto.Remarks, dto.Items);

    // Purchase Bill

    public static List<string> Validate(CreatePurchaseBillDto dto)
    {
        List<string> errors = ValidateTaxAndRemarks(dto.TaxPercentage, dto.Remarks);
        List<CreatePurchaseBillItemDto> items = dto.Items?.ToList() ?? new List<CreatePurchaseBillItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach ((CreatePurchaseBillItemDto item, int index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.PurchaseOrderId.HasValue != item.PurchaseOrderItemId.HasValue)
                errors.Add($"Item {index + 1}: purchase order and purchase order item must be provided together.");
            if (item.PurchaseOrderId is <= 0) errors.Add($"Item {index + 1}: purchase order is invalid.");
            if (item.PurchaseOrderItemId is <= 0) errors.Add($"Item {index + 1}: purchase order item is invalid.");
        }

        AddDuplicateErrors(
            errors,
            items.Where(i => i.PurchaseOrderItemId.HasValue).Select(i => i.PurchaseOrderItemId!.Value),
            "Purchase order item cannot be added more than once.");

        return errors;
    }

    public static List<string> Validate(RegeneratePurchaseBillDto dto) =>
        ValidateTaxAndRemarks(dto.TaxPercentage, dto.Remarks);

    // Purchase Return

    public static List<string> Validate(CreatePurchaseReturnDto dto)
    {
        List<string> errors = new List<string>();
        if (!string.IsNullOrWhiteSpace(dto.Remarks) && dto.Remarks.Length > 1000)
            errors.Add("Remarks cannot exceed 1000 characters.");

        List<CreatePurchaseReturnItemDto> items = dto.Items?.ToList() ?? new List<CreatePurchaseReturnItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach ((CreatePurchaseReturnItemDto item, int index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.PurchaseBillId <= 0) errors.Add($"Item {index + 1}: purchase bill is invalid.");
            if (item.PurchaseBillItemId <= 0) errors.Add($"Item {index + 1}: purchase bill item is invalid.");
            if (item.UnitPrice is < 0) errors.Add($"Item {index + 1}: unit price cannot be negative.");
        }

        AddDuplicateErrors(
            errors,
            items.Select(i => i.PurchaseBillItemId),
            "Purchase bill item cannot be returned more than once in the same return.");

        return errors;
    }

    // Private helpers

    private static List<string> ValidateRequisition(
        string? remarks,
        IEnumerable<CreatePurchaseRequisitionItemDto>? itemSource)
    {
        List<string> errors = new List<string>();
        if (!string.IsNullOrWhiteSpace(remarks) && remarks.Length > 1000)
            errors.Add("Remarks cannot exceed 1000 characters.");

        List<CreatePurchaseRequisitionItemDto> items = itemSource?.ToList() ?? new List<CreatePurchaseRequisitionItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach ((CreatePurchaseRequisitionItemDto item, int index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
        }

        return errors;
    }

    private static List<string> ValidatePurchaseOrder(
        decimal? taxPercentage,
        string? remarks,
        IEnumerable<CreatePurchaseOrderItemDto>? itemSource)
    {
        List<string> errors = ValidateTaxAndRemarks(taxPercentage, remarks);
        List<CreatePurchaseOrderItemDto> items = itemSource?.ToList() ?? new List<CreatePurchaseOrderItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach ((CreatePurchaseOrderItemDto item, int index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.RequisitionId.HasValue != item.RequisitionItemId.HasValue)
                errors.Add($"Item {index + 1}: requisition and requisition item must be provided together.");
            if (item.RequisitionId is <= 0) errors.Add($"Item {index + 1}: requisition is invalid.");
            if (item.RequisitionItemId is <= 0) errors.Add($"Item {index + 1}: requisition item is invalid.");
        }

        AddDuplicateErrors(
            errors,
            items.Where(i => i.RequisitionItemId.HasValue).Select(i => i.RequisitionItemId!.Value),
            "Requisition item cannot be added more than once.");

        return errors;
    }

    private static List<string> ValidateTaxAndRemarks(decimal? taxPercentage, string? remarks)
    {
        List<string> errors = new List<string>();
        if (taxPercentage is < 0 or > 100) errors.Add("Tax percentage must be between 0 and 100.");
        if (!string.IsNullOrWhiteSpace(remarks) && remarks.Length > 1000)
            errors.Add("Remarks cannot exceed 1000 characters.");
        return errors;
    }

    private static void ValidateItemsExist(List<string> errors, int itemCount)
    {
        if (itemCount == 0) errors.Add("At least one item is required.");
        if (itemCount > 100) errors.Add("A purchase document cannot contain more than 100 items.");
    }

    private static void ValidateProductAndQuantity(List<string> errors, int productId, decimal quantity, int index)
    {
        if (productId <= 0) errors.Add($"Item {index + 1}: product is required.");
        if (quantity <= 0) errors.Add($"Item {index + 1}: quantity must be greater than zero.");
        if (quantity > 999999) errors.Add($"Item {index + 1}: quantity is too large.");
    }

    private static void AddDuplicateErrors(List<string> errors, IEnumerable<int> values, string message)
    {
        if (values.GroupBy(v => v).Any(g => g.Count() > 1))
            errors.Add(message);
    }
}
