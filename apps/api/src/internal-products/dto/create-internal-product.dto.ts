export class CreateInternalProductDto {
  productType?: 'internal' | 'service' | 'reseller'
  slug?: string | null
  name: string
  industry?: string | null
  landingPageLink?: string | null
  iconUrl?: string | null
  isActive?: boolean
}
