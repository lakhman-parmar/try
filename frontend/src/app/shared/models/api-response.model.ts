// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: string[];
}
