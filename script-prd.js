function runPicWordify() {
    console.log('(PicWordify) Initializing alt text generation');
  
    const domainId = getDomainId();
    if (!domainId) {
      console.error('(PicWordify) No domain ID found');
      return;
    }
  
    // Process existing images
    processExistingImages(domainId);
  
    // Set up MutationObserver to watch for new images
    setupMutationObserver(domainId);
  }
  
  function getDomainId() {
    const script = document.querySelector('script[src*="https://cdn.jsdelivr.net/gh/codeyourwayup/pic-wordify-script@main/script-prd.js"]');
    return script ? script.getAttribute('data-domain-id') : null;
  }
  
  function getFullImagePath(src) {
    if (src.startsWith('http')) {
      return src;
    }
    return new URL(src, window.location.origin).href;
  }
  
  function processExistingImages(domainId) {
    const images = Array.from(document.querySelectorAll('img'))
      // .filter(img => img.naturalWidth > 100 && img.naturalHeight > 100)
      .filter(img => !img.alt || img.alt.trim() === '');
  
      console.log({
        images
      })
    if (images.length > 0) {
      processImages(images, domainId);
    }
  }
  
  function setupMutationObserver(domainId) {
    const observer = new MutationObserver((mutations) => {
      const newImages = [];
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'IMG' && 
                node.naturalWidth > 100 && 
                node.naturalHeight > 100 && 
                (!node.alt || node.alt.trim() === '')) {
              newImages.push(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('img').forEach((img) => {
                if (img.naturalWidth > 100 && 
                    img.naturalHeight > 100 && 
                    (!img.alt || img.alt.trim() === '')) {
                  newImages.push(img);
                }
              });
            }
          });
        }
      });
  
      if (newImages.length > 0) {
        processImages(newImages, domainId);
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  async function processImages(images, domainId) {
    console.debug('(PicWordify) Processing images:', images.length);
  
    const imageBatch = images.map(img => ({
      url: getFullImagePath(img.src),
      element: img
    }));
  
    try {
      const response = await fetch('https://www.picwordify.com/api/v1/alt-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageBatch.map(img => img.url),
          domainId: domainId,
          language: document.documentElement.lang || 'en',
          tone: 'professional'
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Update alt texts for processed images
      imageBatch.forEach((img, index) => {
        if (data.results && data.results[index]?.alt) {
          img.element.alt = data.results[index].alt;
          console.debug('(PicWordify) Updated alt text for:', img.url);
        }
      });
    } catch (error) {
      console.error('(PicWordify) Error processing images:', error);
    }
  }
  
  // Initialize the script
  if (document.readyState === 'loading') {
    console.log('(PicWordify) Page is still loading, adding listener');
    document.addEventListener('DOMContentLoaded', runPicWordify);
  } else {
    console.log('(PicWordify) Page already loaded, running immediately');
    runPicWordify();
  }
