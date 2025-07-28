import { Account } from '@hiveio/dhive'

export interface AccountData {
  account: Account
  jsonMetadata: Record<string, any>
  postingMetadata: Record<string, any>
}

/**
 * Fetch a Hive account and parse its metadata.
 */
export async function fetchAccount(username: string): Promise<AccountData> {
  const response = await fetch('https://api.hive.blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_accounts',
      params: [[username]],
      id: 1,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Hive account')
  }

  const accountResp = await response.json()

  if (!accountResp.result || accountResp.result.length === 0) {
    throw new Error('Account not found')
  }

  const account: Account = accountResp.result[0]

  let jsonMetadata: Record<string, any> = {}
  let postingMetadata: Record<string, any> = {}

  try {
    if (account.json_metadata) {
      jsonMetadata = JSON.parse(account.json_metadata)
    }
  } catch {
    jsonMetadata = {}
  }

  try {
    if (account.posting_json_metadata) {
      postingMetadata = JSON.parse(account.posting_json_metadata)
    }
  } catch {
    postingMetadata = {}
  }

  return { account, jsonMetadata, postingMetadata }
}

export default fetchAccount
