# API Integration Guide

## Overview
This drawing canvas app is prepared to integrate with RunPod/Banana AI API for generating drawings from canvas images.

## Image Format
- **Format**: JPEG
- **Quality**: 0.9 (90%)
- **Background**: White (transparent areas filled with white)

## API Integration Location
The API integration code is located in `/components/AiPanel.tsx` in the `generateWithData()` function.

## Data Sent to API

### FormData Structure
```javascript
const formData = new FormData();
formData.append('image', blob, 'canvas.jpg');  // JPEG blob
formData.append('prompt', prompt);              // User's text prompt
formData.append('style', selectedStyle);        // Selected art style
```

### Available Art Styles
- `sketch` - Simple line drawing
- `watercolor` - Soft, flowing colors
- `pencil` - Realistic pencil sketch
- `ink` - Bold ink lines
- `charcoal` - Dark, textured strokes
- `pastel` - Soft chalk colors
- `digital` - Modern digital style
- `anime` - Japanese animation style

## API Endpoint Configuration

### Current Setup (Placeholder)
```javascript
const API_ENDPOINT = 'YOUR_RUNPOD_BANANA_API_ENDPOINT_HERE';
```

### How to Add Your API Endpoint

1. **Open** `/components/AiPanel.tsx`
2. **Find** the `generateWithData()` function (around line 78)
3. **Replace** `YOUR_RUNPOD_BANANA_API_ENDPOINT_HERE` with your actual endpoint
4. **Uncomment** the API call code:

```javascript
const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  body: formData,
});

if (!response.ok) {
  throw new Error('API request failed');
}

const result = await response.json();
const generatedImage = result.image; // Adjust based on your API response
```

5. **Update** the response handling based on your API's response format

## Expected API Response

The app expects a response containing a generated image. Adjust this based on your API:

```javascript
{
  "image": "data:image/jpeg;base64,..." // or URL
  // other fields...
}
```

## Canvas Selection

Users can select either:

### 1. Selected Area
- User draws a selection rectangle on canvas
- Only that area is sent as JPEG to the API
- Preview shown in AI panel

### 2. Whole Canvas
- Entire canvas is exported as JPEG
- Sent to API for generation

## Debugging

The app logs API preparation data to console:

```javascript
console.log('🎨 Data prepared for API:', {
  prompt,
  style: selectedStyle,
  imageSize: `${blob.size} bytes`,
  imageType: blob.type,
});
```

Check the browser console to verify:
- Image is properly converted to JPEG
- Blob size is reasonable
- All parameters are correct

## Testing

Before connecting to real API:

1. Open browser DevTools → Console
2. Make a selection or use whole canvas
3. Click "Generate Drawing"
4. Check the logged data
5. Verify the image preview shows correctly

## Next Steps

1. ✅ Get your RunPod/Banana API endpoint
2. ✅ Update `API_ENDPOINT` in `AiPanel.tsx`
3. ✅ Uncomment API call code
4. ✅ Adjust response handling for your API format
5. ✅ Test with real API
6. ✅ Handle errors appropriately

## Error Handling

The app includes error handling:

```javascript
try {
  // API call
} catch (error) {
  console.error('Generation error:', error);
  toast.error('Failed to generate drawing. Please try again.');
}
```

Add more specific error handling based on your API's error responses.

## Security Notes

⚠️ **Important Security Considerations:**

1. Never commit API keys to the repository
2. Use environment variables for sensitive data
3. Implement rate limiting if needed
4. Validate file sizes before sending
5. Add authentication if required by your API

## Example: Adding API Key

If your API requires an API key:

```javascript
const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_API_KEY}`,
    // Add other headers as needed
  },
  body: formData,
});
```

## Support

For issues with:
- Canvas selection: Check browser console for errors
- Image format: Verify JPEG export in preview
- API integration: Check network tab in DevTools
