export function sanitizeMapEmbedCode(html: string): string {
  if (typeof window === 'undefined') return ''; // Server-side safety
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const iframe = doc.querySelector('iframe');

    if (!iframe) return '';

    // Create a new clean iframe element
    const cleanIframe = document.createElement('iframe');
    
    // Whitelist of allowed attributes
    const allowedAttributes = [
      'src', 
      'width', 
      'height', 
      'style', 
      'allowfullscreen', 
      'loading', 
      'referrerpolicy',
      'title', 
      'aria-hidden',
      'class',
      'frameborder'
    ];

    let hasSrc = false;

    // Copy only allowed attributes
    allowedAttributes.forEach(attr => {
      if (iframe.hasAttribute(attr)) {
        const value = iframe.getAttribute(attr);
        
        // Strict validation for src
        if (attr === 'src') {
          if (value && (value.startsWith('https://') || value.startsWith('http://'))) {
            // Prevent javascript: protocol
            if (!value.toLowerCase().includes('javascript:')) {
              cleanIframe.setAttribute(attr, value);
              hasSrc = true;
            }
          }
        } else {
           // For other attributes, just copy (attribute values are generally safe if not src/href/event handlers)
           // But to be extra safe against "javascript:" in other places (unlikely for these attrs but good practice)
           if (value) {
             cleanIframe.setAttribute(attr, value);
           }
        }
      }
    });

    if (!hasSrc) return '';

    return cleanIframe.outerHTML;
  } catch (e) {
    console.error('Sanitization error:', e);
    return '';
  }
}
