document.addEventListener("DOMContentLoaded", function() {
    const imageGrid = document.getElementById("image-grid");
    const searchBar = document.getElementById("search-bar");
    const customIpAddress = "http://192.168.0.27/json/state"; // Replace with your custom IP address

    // Fetch the textures JSON file
    fetch('textures.json')
        .then(response => response.json())
        .then(data => {
            // Display all images initially
            displayImages(data);

            // Add an event listener for the search bar
            searchBar.addEventListener("input", function() {
                const searchText = searchBar.value.toLowerCase();
                const filteredData = data.filter(imagePath => 
                    imagePath.toLowerCase().includes(searchText)
                );
                // Display filtered images
                displayImages(filteredData);
            });
        });

    // Function to display images
    function displayImages(images) {
        imageGrid.innerHTML = "";
        images.forEach(imagePath => {
            const imgElement = document.createElement("img");
            imgElement.src = imagePath;
            imgElement.alt = "Image";
            // Add click event listener to each image
            imgElement.addEventListener("click", () => {
                processImage(imagePath);
            });
            imageGrid.appendChild(imgElement);
        });
    }
   
    // Function to process the clicked image
    function processImage(imagePath) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imagePath;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = extractColors(imageData);
            const wledJson = convertToWledJson(colors);
            sendJsonResponse(wledJson);
        };
    }

    // Function to extract colors from image data
    function extractColors(imageData) {
        const { data, width, height } = imageData;
        const colors = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const hexColor = rgbToHex(r, g, b);
                colors.push(hexColor);
            }
        }
        return colors;
    }

    // Function to convert RGB to HEX
    function rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    // Function to convert colors to WLED JSON format
    function convertToWledJson(colors) {
        const colorSegments = [];
        let currentColor = colors[0];
        let startIndex = 0;

        for (let i = 1; i <= colors.length; i++) {
            if (i === colors.length || colors[i] !== currentColor) {
                if (startIndex !== i - 1) {
                    colorSegments.push(startIndex, i - 1, currentColor);
                } else {
                    colorSegments.push(startIndex, currentColor);
                }
                if (i < colors.length) {
                    currentColor = colors[i];
                    startIndex = i;
                }
            }
        }

        return {
            on: true,
            bri: 128,
            seg: {
                id: 0,
                i: colorSegments
            }
        };
    }

    // Function to send the JSON response to the specified IP address
    function sendJsonResponse(wledJson) {
        fetch(customIpAddress, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wledJson)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Success:', responseData);
        })
        .catch(error => {
            console.error('Error sending JSON response:', error);
        });
    }
});
