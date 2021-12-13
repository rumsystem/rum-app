export interface IProducer {
  owner: string
  total_votes: number
  producer_key: string
  unpaid_blocks: number
  last_claim_time: string
  is_active: boolean
  url: string
}
