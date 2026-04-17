import React, {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { dynamoClient: client } = await init();
        if (!cancelled) {
          setDynamoClient(client);
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
      setDynamoClient,
    }),
    [dynamoClient]
  );

  return (
    <ServicesContext.Provider value={servicesValue}>
      {children}
    </ServicesContext.Provider>
  );
}
