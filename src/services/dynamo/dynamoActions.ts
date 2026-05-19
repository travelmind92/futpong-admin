import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DynamoDBDocumentClient,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';
import { useCallback, useContext } from 'react';
import { ServicesContext } from '../../context/servicesOutletContext';
import { createBatches } from './utils';

type Attribute = Record<string, NativeAttributeValue>;

export const useDynamoActions = () => {
  const services = useContext(ServicesContext);
  const dynamoClient = services?.dynamoClient;

  return useCallback(
    (client: DynamoDBDocumentClient = dynamoClient!) => {

    const save = async (table: string, items: Attribute[]) => {
      if (items.length === 0) {
        return;
      }
      try {
        const batches = createBatches(items);
        for (const batchItems of batches) {
          await saveBatch(table, batchItems);
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    };

    const saveBatch = async (table: string, items: Attribute[]) => {
      const params: BatchWriteCommandInput = {
        RequestItems: {
          [table]: items.map((item) => ({
            PutRequest: {
              Item: item,
            },
          })),
        },
      };
      const result = await client.send(new BatchWriteCommand(params));
      return result.UnprocessedItems;
    };

    const remove = async (table: string, ids: string[]) => {
      if (ids.length === 0) {
        return;
      }
      try {
        const batches = createBatches(ids);
        for (const batchIds of batches) {
          await removeBatch(table, batchIds);
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    };

    const removeBatch = async (table: string, ids: string[]) => {
      const params: BatchWriteCommandInput = {
        RequestItems: {
          [table]: ids.map((id) => ({
            DeleteRequest: {
              Key: {
                id,
              },
            },
          })),
        },
      };
      const result = await client.send(new BatchWriteCommand(params));
      return result.UnprocessedItems;
    };

    return {
      save,
      remove,
    };
  },
  [dynamoClient]
  );
};
