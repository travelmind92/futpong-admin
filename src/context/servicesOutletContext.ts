import { createContext } from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export type ServicesOutletContextValue = {
  dynamoClient: DynamoDBDocumentClient | undefined;
  s3Client: S3Client | undefined;
  setDynamoClient: (client: DynamoDBDocumentClient) => void;
};

export const ServicesContext = createContext<
  ServicesOutletContextValue | undefined
>(undefined);
