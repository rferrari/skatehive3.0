import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GRAPHQL_URL } from './constants';

export const noCacheApolloClient = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'no-cache', errorPolicy: 'ignore' },
    query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
  },
}); 