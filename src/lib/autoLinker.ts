import { ProductItem } from '@/data/products';

export function autoLinkContent(content: string, products: ProductItem[]): string {
  if (!content) return '';

  let linkedContent = content;

  // Sort products by name length (descending) to avoid partial matches
  // e.g., match "Super Phone Pro" before "Super Phone"
  const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

  // We need to keep track of ranges we've already linked to avoid double linking
  // But doing that with simple replace is hard.
  // A safer strategy:
  // 1. Identify all candidate keywords (product names).
  // 2. Replace them with a temporary placeholder if they are not inside a tag.
  // 3. Replace placeholders with actual links.

  // However, simple regex with lookahead for "not inside tag" is often sufficient for simple CMS content.
  // Regex: /Product Name(?![^<]*>|[^<>]*<\/a>)/gi
  
  // Refined regex to match exact words or phrases, and avoid replacing inside HTML tags attributes or existing anchors.
  // The negative lookahead (?![^<]*>) ensures we are not inside a tag (like <img alt="Product Name">)
  // The negative lookahead (?![^<>]*<\/a>) ensures we are not already inside an anchor tag.
  
  for (const product of sortedProducts) {
    if (!product.name || product.name.length < 2) continue; // Skip very short names

    // Escape special regex characters in product name
    const escapedName = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Construct regex
    // We use a boundary-like check. Since Persian doesn't always use spaces, strictly \b might fail or be too strict.
    // But usually we want to match the full name.
    // Let's try matching the name exactly.
    
    const regex = new RegExp(`(${escapedName})(?![^<]*>)(?![^<>]*<\\/a>)`, 'g');
    
    // We only want to link the FIRST occurrence to avoid spamming.
    // String.replace with a string replaces only the first occurrence.
    // String.replace with a global regex replaces all.
    // We can use a counter or just replace the first one.
    
    let replaced = false;
    linkedContent = linkedContent.replace(regex, (match) => {
        if (replaced) return match; // Already replaced one instance of THIS product
        replaced = true;
        const url = `/product/${product.slug || product.id}`;
        return `<a href="${url}" class="text-[#83b735] hover:underline font-medium" title="${product.name}">${match}</a>`;
    });
  }

  return linkedContent;
}
