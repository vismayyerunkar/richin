import { IGenericResponse } from './genericModels';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
}

export interface IGetGptResponse extends IGenericResponse {
  response: string;
}