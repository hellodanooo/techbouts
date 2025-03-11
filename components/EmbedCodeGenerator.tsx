// app/components/EmbedCodeGenerator.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckIcon, CopyIcon } from 'lucide-react';

interface EmbedCodeGeneratorProps {
  eventId: string;
  eventName: string;
  promoterId: string;
}

export default function EmbedCodeGenerator({ eventId, eventName, promoterId }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(700);
  const [customization, setCustomization] = useState({
    hideHeader: true,
    customColor: false,
    primaryColor: '#3B82F6',
    allowResize: true
  });

  // Base URL of your application
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techbouts.com';
  
  // Generate the iframe embed code
  const generateIframeCode = () => {
    const queryParams = new URLSearchParams();
    
    if (customization.hideHeader) {
      queryParams.append('hideHeader', 'true');
    }
    
    if (customization.customColor) {
      queryParams.append('color', customization.primaryColor.replace('#', ''));
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return `<iframe 
  src="${baseUrl}/events/${promoterId}/${eventId}/embed${queryString}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  scrolling="auto"
  allow="payment"
  style="border: none; max-width: 100%;"
  title="${eventName} Registration"
  ${customization.allowResize ? 'data-auto-resize="true"' : ''}
></iframe>
 <div style="text-align: right; margin-top: 4px; font-size: 11px; font-family: Arial, sans-serif; color: #6b7280;">
    <a href="https://techbouts.com" target="_blank" style="display: inline-flex; align-items: center; text-decoration: none; color: #6b7280;">
      <span style="margin-right: 4px;">Powered by</span>
      <img src="https://www.techbouts.com/logos/techboutslogoFlat.png" alt="TechBouts" style="height: 14px; width: auto;" />
    </a>
  </div>`;
  };
  
  // Generate the JavaScript embed code (more advanced)
  const generateJsCode = () => {
    return `<div id="techbouts-registration-${promoterId}-${eventId}"></div>
<script>
  (function() {
    // Create script element
    var script = document.createElement('script');
    script.src = "${baseUrl}/embeds/registration-loader.js";
    script.async = true;
    
    // Add configuration
    script.setAttribute('data-event-id', '${eventId}');
    script.setAttribute('data-container-id', 'techbouts-registration-${eventId}');
    ${customization.hideHeader ? 'script.setAttribute(\'data-hide-header\', \'true\');' : ''}
    ${customization.customColor ? `script.setAttribute('data-color', '${customization.primaryColor}');` : ''}
    ${customization.allowResize ? 'script.setAttribute(\'data-auto-resize\', \'true\');' : ''}
    script.setAttribute('data-width', '${width}');
    script.setAttribute('data-height', '${height}');
    
    // Add script to document
    document.head.appendChild(script);
  })();
</script>`;
  };

  // Generate WordPress shortcode
  const generateWordPressCode = () => {
    const attributes = [
      `id="${eventId}"`,
      `width="${width}"`,
      `height="${height}"`,
      customization.hideHeader ? 'hide_header="true"' : '',
      customization.customColor ? `color="${customization.primaryColor}"` : '',
      customization.allowResize ? 'auto_resize="true"' : ''
    ].filter(Boolean).join(' ');
    
    return `[techbouts_registration ${attributes}]`;
  };
  
  // Handle copy to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Embed Registration Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="iframe">Standard Embed</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript Embed</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input 
                  id="width" 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(parseInt(e.target.value))} 
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input 
                  id="height" 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value))} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hideHeader"
                  checked={customization.hideHeader}
                  onChange={(e) => setCustomization({...customization, hideHeader: e.target.checked})}
                />
                <Label htmlFor="hideHeader">Hide header</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customColor"
                  checked={customization.customColor}
                  onChange={(e) => setCustomization({...customization, customColor: e.target.checked})}
                />
                <Label htmlFor="customColor">Custom primary color</Label>
                
                {customization.customColor && (
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                    className="ml-2"
                  />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowResize"
                  checked={customization.allowResize}
                  onChange={(e) => setCustomization({...customization, allowResize: e.target.checked})}
                />
                <Label htmlFor="allowResize">Auto-resize height</Label>
              </div>
            </div>
          </div>
          
          <TabsContent value="iframe" className="mt-0">
            <div className="bg-gray-100 p-4 rounded-md relative">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{generateIframeCode()}</pre>
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateIframeCode())}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Paste this code into any HTML page to embed your registration form.
            </p>
          </TabsContent>
          
          <TabsContent value="javascript" className="mt-0">
            <div className="bg-gray-100 p-4 rounded-md relative">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{generateJsCode()}</pre>
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateJsCode())}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This JavaScript embed is more flexible and will automatically resize based on content.
            </p>
          </TabsContent>
          
          <TabsContent value="wordpress" className="mt-0">
            <div className="bg-gray-100 p-4 rounded-md relative">
              <pre className="text-sm overflow-x-auto">{generateWordPressCode()}</pre>
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generateWordPressCode())}
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this shortcode if you have the TechBouts WordPress plugin installed.
            </p>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Live Preview</h3>
          <div className="border rounded-md p-2 bg-gray-50">
            <iframe 
              src={`${baseUrl}/events/${promoterId}/${eventId}/embed${customization.hideHeader ? '?hideHeader=true' : ''}${customization.customColor ? `${customization.hideHeader ? '&' : '?'}color=${customization.primaryColor.replace('#', '')}` : ''}`}
              width={width} 
              height={height}
              frameBorder="0"
              title="Registration Form Preview"
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}