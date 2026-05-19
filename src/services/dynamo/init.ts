import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { COGNITO_IDENTITY_POOL_ID } from '../awsConfig';
import { ENV } from '../../constants/env';

export const init = async () => {
  const credentials = fromCognitoIdentityPool({
    clientConfig: {
      region: ENV.AWS_REGION,
    },
    identityPoolId: COGNITO_IDENTITY_POOL_ID,
  });

  const s3Client = new S3Client({
    region: ENV.AWS_REGION,
    credentials,
  });

  const baseClient = new DynamoDBClient({
    region: ENV.AWS_REGION,
    credentials,
  });

  const dynamoClient = DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });

  return {
    dynamoClient,
    s3Client,
  };
};
