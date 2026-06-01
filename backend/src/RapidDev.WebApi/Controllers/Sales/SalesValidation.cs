using RapidDev.Application.DTOs.Sales;

namespace RapidDev.WebApi.Controllers.Sales;

internal static class SalesValidation
{
    public static List<string> ValidateFilter(int pageNumber, int pageSize, DateTime? fromDate, DateTime? toDate, string? search)
    {
        var errors = new List<string>();
        if (pageNumber <= 0) errors.Add("Page number must be greater than zero.");
        if (pageSize <= 0 || pageSize > 100) errors.Add("Page size must be between 1 and 100.");
        if (fromDate.HasValue && toDate.HasValue && fromDate.Value.Date > toDate.Value.Date)
            errors.Add("From date cannot be later than to date.");
        if (!string.IsNullOrWhiteSpace(search) && search.Length > 200)
            errors.Add("Search cannot exceed 200 characters.");
        return errors;
    }

    public static List<string> Validate(CreateEstimationDto dto) =>
        ValidateEstimation(dto.CustomerId, dto.Remarks, dto.Items);

    public static List<string> Validate(UpdateEstimationDto dto) =>
        ValidateEstimation(dto.CustomerId, dto.Remarks, dto.Items);

    public static List<string> Validate(CreateSalesOrderDto dto) =>
        ValidateSalesOrder(dto.CustomerId, dto.TaxPercentage, dto.Remarks, dto.Items);

    public static List<string> Validate(UpdateSalesOrderDto dto) =>
        ValidateSalesOrder(dto.CustomerId, dto.TaxPercentage, dto.Remarks, dto.Items);

    public static List<string> Validate(CreateSalesInvoiceDto dto)
    {
        var errors = ValidateCommonHeader(dto.CustomerId, dto.TaxPercentage, dto.Remarks);
        var items = dto.Items?.ToList() ?? new List<CreateSalesInvoiceItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach (var (item, index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.UnitPrice is < 0) errors.Add($"Item {index + 1}: unit price cannot be negative.");
            if (item.SalesOrderId.HasValue != item.SalesOrderItemId.HasValue)
                errors.Add($"Item {index + 1}: sales order and sales order item must be provided together.");
            if (item.SalesOrderId is <= 0) errors.Add($"Item {index + 1}: sales order is invalid.");
            if (item.SalesOrderItemId is <= 0) errors.Add($"Item {index + 1}: sales order item is invalid.");
        }

        AddDuplicateErrors(
            errors,
            items.Where(i => i.SalesOrderItemId.HasValue).Select(i => i.SalesOrderItemId!.Value),
            "Sales order item cannot be added more than once.");

        return errors;
    }

    public static List<string> Validate(RegenerateSalesInvoiceDto dto)
    {
        var errors = ValidateTaxAndRemarks(dto.TaxPercentage, dto.Remarks);
        return errors;
    }

    public static List<string> Validate(CreateSalesReturnDto dto)
    {
        var errors = ValidateCustomerAndRemarks(dto.CustomerId, dto.Remarks);
        if (!dto.SalesInvoiceId.HasValue) errors.Add("Sales invoice is required.");
        if (dto.SalesInvoiceId is <= 0) errors.Add("Sales invoice is invalid.");

        var items = dto.Items?.ToList() ?? new List<CreateSalesReturnItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach (var (item, index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.SalesInvoiceId <= 0) errors.Add($"Item {index + 1}: sales invoice is invalid.");
            if (item.SalesInvoiceItemId <= 0) errors.Add($"Item {index + 1}: sales invoice item is invalid.");
            if (dto.SalesInvoiceId.HasValue && item.SalesInvoiceId != dto.SalesInvoiceId.Value)
                errors.Add($"Item {index + 1}: item invoice does not match the selected sales invoice.");
            if (item.UnitPrice is < 0) errors.Add($"Item {index + 1}: unit price cannot be negative.");
        }

        AddDuplicateErrors(
            errors,
            items.Select(i => i.SalesInvoiceItemId),
            "Sales invoice item cannot be returned more than once in the same return.");

        return errors;
    }

    private static List<string> ValidateEstimation(
        int? customerId,
        string? remarks,
        IEnumerable<CreateEstimationItemDto>? itemSource)
    {
        var errors = ValidateCustomerAndRemarks(customerId, remarks);
        var items = itemSource?.ToList() ?? new List<CreateEstimationItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach (var (item, index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
        }

        return errors;
    }

    private static List<string> ValidateSalesOrder(
        int? customerId,
        decimal? taxPercentage,
        string? remarks,
        IEnumerable<CreateSalesOrderItemDto>? itemSource)
    {
        var errors = ValidateCommonHeader(customerId, taxPercentage, remarks);
        var items = itemSource?.ToList() ?? new List<CreateSalesOrderItemDto>();
        ValidateItemsExist(errors, items.Count);

        foreach (var (item, index) in items.Select((item, index) => (item, index)))
        {
            ValidateProductAndQuantity(errors, item.ProductId, item.Quantity, index);
            if (item.EstimationId.HasValue != item.EstimationItemId.HasValue)
                errors.Add($"Item {index + 1}: estimation and estimation item must be provided together.");
            if (item.EstimationId is <= 0) errors.Add($"Item {index + 1}: estimation is invalid.");
            if (item.EstimationItemId is <= 0) errors.Add($"Item {index + 1}: estimation item is invalid.");
        }

        AddDuplicateErrors(
            errors,
            items.Where(i => i.EstimationItemId.HasValue).Select(i => i.EstimationItemId!.Value),
            "Estimation item cannot be added more than once.");

        return errors;
    }

    private static List<string> ValidateCommonHeader(int? customerId, decimal? taxPercentage, string? remarks)
    {
        var errors = ValidateCustomerAndRemarks(customerId, remarks);
        errors.AddRange(ValidateTaxAndRemarks(taxPercentage, null));
        return errors;
    }

    private static List<string> ValidateCustomerAndRemarks(int? customerId, string? remarks)
    {
        var errors = new List<string>();
        if (customerId is <= 0) errors.Add("Customer is invalid.");
        if (!string.IsNullOrWhiteSpace(remarks) && remarks.Length > 1000)
            errors.Add("Remarks cannot exceed 1000 characters.");
        return errors;
    }

    private static List<string> ValidateTaxAndRemarks(decimal? taxPercentage, string? remarks)
    {
        var errors = new List<string>();
        if (taxPercentage is < 0 or > 100) errors.Add("Tax percentage must be between 0 and 100.");
        if (!string.IsNullOrWhiteSpace(remarks) && remarks.Length > 1000)
            errors.Add("Remarks cannot exceed 1000 characters.");
        return errors;
    }

    private static void ValidateItemsExist(List<string> errors, int itemCount)
    {
        if (itemCount == 0) errors.Add("At least one item is required.");
        if (itemCount > 100) errors.Add("A sales document cannot contain more than 100 items.");
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
