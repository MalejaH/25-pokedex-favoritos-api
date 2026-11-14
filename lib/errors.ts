export type ErrorDetail = {
  campo: string;
  mensaje: string;
};

export class HttpError extends Error {
  public readonly status: number;
  public readonly detalles?: ErrorDetail[];

  public constructor(status: number, message: string, detalles?: ErrorDetail[]) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.detalles = detalles;
  }
}
