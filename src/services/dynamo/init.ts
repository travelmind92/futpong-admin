import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const init = async () => {
  const credentials = fromCognitoIdentityPool({
    clientConfig: {
      region: 'us-east-1'
    },
    identityPoolId: 'us-east-1:6c7336a7-d962-4951-836b-fd367c508ed7',
  })

  const baseClient = new DynamoDBClient({
    region: 'us-east-1',
    credentials
  })

  const dynamoClient = DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true
    },
    unmarshallOptions: {
      wrapNumbers: false
    }
  })

  return {
    dynamoClient
  }
}
