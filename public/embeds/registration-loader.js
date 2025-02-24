// public/embeds/registration-loader.js

(function() {
    // Get the current script element
    const currentScript = document.currentScript;
    
    // Extract configuration from script attributes
    const eventId = currentScript.getAttribute('data-event-id');
    const containerId = currentScript.getAttribute('data-container-id') || `techbouts-registration-${eventId}`;
    const hideHeader = currentScript.getAttribute('data-hide-header') === 'true';
    const color = currentScript.getAttribute('data-color');
    const autoResize = currentScript.getAttribute('data-auto-resize') === 'true';
    const width = currentScript.getAttribute('data-width') || '100%';
    const height = currentScript.getAttribute('data-height') || '700';
    
    // Validate required parameters
    if (!eventId) {
      console.error('TechBouts Registration: Missing required data-event-id attribute');
      return;
    }
    
    // Find the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`TechBouts Registration: Container element with ID "${containerId}" not found`);
      return;
    }
    
    // Build the iframe URL with query parameters
    const baseUrl = 'https://techbouts.com'; // Replace with your actual domain
    let iframeUrl = `${baseUrl}/events/${eventId}/embed`;
    
    const queryParams = new URLSearchParams();
    if (hideHeader) queryParams.append('hideHeader', 'true');
    if (color) queryParams.append('color', color);
    
    if (queryParams.toString()) {
      iframeUrl += `?${queryParams.toString()}`;
    }
    
    // Create the iframe element
    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.width = width;
    iframe.height = height;
    iframe.frameBorder = '0';
    iframe.scrolling = 'auto';
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    iframe.allow = 'payment';
    iframe.title = `TechBouts Registration Form ${eventId}`;
    
    // Append the iframe to the container
    container.appendChild(iframe);
    
    // Handle iframe resizing if enabled
    if (autoResize) {
      // Listen for messages from the iframe
      window.addEventListener('message', function(event) {
        // Verify the origin of the message
        if (event.origin !== baseUrl) return;
        
        // Handle height adjustment messages
        if (event.data && event.data.type === 'REGISTRATION_IFRAME_HEIGHT' && 
            event.data.eventId === eventId && event.data.height) {
          iframe.style.height = `${event.data.height}px`;
        }
        
        // Handle registration completion
        if (event.data && 
            (event.data.type === 'REGISTRATION_SUCCESS' || event.data.type === 'REGISTRATION_ERROR') && 
            event.data.eventId === eventId) {
          // Dispatch a custom event that site owners can listen for
          const customEvent = new CustomEvent('techboutsRegistration', {
            detail: {
              type: event.data.type,
              eventId: event.data.eventId,
              data: event.data.data
            }
          });
          document.dispatchEvent(customEvent);
        }
      });
    }
    
    // Notify that the embed is loaded
    console.log(`TechBouts Registration embed loaded for event ${eventId}`);
  })();