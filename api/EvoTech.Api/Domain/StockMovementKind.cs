namespace EvoTech.Api.Domain;

/// <summary>
/// Stored as text, not as an int — see StockMovementConfiguration. That means
/// the member names ARE the database values, so:
///   • reordering these is safe (position is irrelevant)
///   • RENAMING one breaks every existing row and needs a data migration
/// No explicit numeric values, because nothing reads them.
/// </summary>
public enum StockMovementKind
{
    /// <summary>Goods received from a supplier. Positive quantity.</summary>
    Purchase,

    /// <summary>Sold to a customer. Negative quantity.</summary>
    Sale,

    /// <summary>Stocktake correction, breakage, loss. Either direction.</summary>
    Adjustment
}
