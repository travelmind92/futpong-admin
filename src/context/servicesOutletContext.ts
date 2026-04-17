import { createContext } from 'react';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export type ServicesOutletContextValue = {
  dynamoClient: DynamoDBDocumentClient | undefined;
  setDynamoClient: (client: DynamoDBDocumentClient) => void;
};

export const ServicesContext = createContext<
  ServicesOutletContextValue | undefined
>(undefined);
