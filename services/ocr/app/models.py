from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str
    quantity: float | None = None
    unit_price: float | None = Field(default=None, alias="unitPrice")

    model_config = {"populate_by_name": True}


class ExtractionResponse(BaseModel):
    method: str
    text: str
    line_items: list[LineItem] = Field(alias="lineItems")

    model_config = {"populate_by_name": True}
