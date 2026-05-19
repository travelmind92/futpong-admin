import React, {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { init } from '../services/dynamo/init';
import { ServicesContext, ServicesOutletContextValue } from './servicesOutletContext';

/**
 * Initializes Dynamo once and exposes the document client via ServicesContext.
 * Nest table-specific providers (e.g. ExercisesProvider) inside this.
 */
export function DynamoServicesProvider({ children }: { children: ReactNode }) {
  const [dynamoClient, setDynamoClient] = useState<
    DynamoDBDocumentClient | undefined
  >();
  const [s3Client, setS3Client] = useState<S3Client | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { dynamoClient: dClient, s3Client: sClient } = await init();
        if (!cancelled) {
          setDynamoClient(dClient);
          setS3Client(sClient);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const servicesValue = useMemo(
    (): ServicesOutletContextValue => ({
      dynamoClient,
      s3Client,
      setDynamoClient,
    }),
    [dynamoClient, s3Client]
  );

  return (
    <ServicesContext.Provider value={servicesValue}>
      {children}
    </ServicesContext.Provider>
  );
}
