const API_BASE_URL = "http://localhost:8080/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const playerForm = document.getElementById("playerForm");
  const playerSelect = document.getElementById("playerSelect");
  const imageUpload = document.getElementById("imageUpload");
  const uploadImageBtn = document.getElementById("uploadImageBtn");
  const submitBtn = document.getElementById("submitBtn");
  const imageStatus = document.getElementById("imageStatus");
  const uploadingIndicator = document.getElementById("uploadingIndicator");
  const uploadSuccess = document.getElementById("uploadSuccess");
  const uploadError = document.getElementById("uploadError");
  const imagePreview = document.getElementById("imagePreview");
  const submitHelperText = document.getElementById("submitHelperText");
  const imageUploadContainer = document.getElementById("imageUploadContainer");
  const imageStep = document.getElementById("imageStep");
  const submitStep = document.getElementById("submitStep");

  // State variables
  let uploadedImageUrl = null;
  let isUploading = false;

  // Only proceed if we have all required elements
  if (!playerForm || !playerSelect || !submitBtn) {
    console.error("Critical elements not found!");
    return;
  }

  /**
   * Compresses an image file to reduce its size
   * @param {File} file - The image file to compress
   * @param {number} maxSizeMB - Maximum size in MB
   * @returns {Promise<File>} - Compressed file
   */
  async function compressImage(file, maxSizeMB = 1) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          // Get original dimensions
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 800; // Max width/height for player images
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // Create canvas for compression
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              console.log(
                `Original size: ${(file.size / 1024).toFixed(
                  2
                )}KB, Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`
              );
              resolve(compressedFile);
            },
            "image/jpeg",
            0.75
          ); // 75% quality
        };
      };
    });
  }

  /**
   * Loads player data from API
   */
  async function loadPlayers() {
    try {
      const response = await fetch(`${API_BASE_URL}/player-stats`);
      if (!response.ok) {
        console.error(
          `Server returned ${response.status}: ${await response.text()}`
        );
        throw new Error("Failed to fetch players");
      }

      const players = await response.json();
      players.sort((a, b) => a.name.localeCompare(b.name));
      const options = players
        .map(
          (player) =>
            `<option value="${player.member_id}" data-name="${player.name}">${player.name}</option>`
        )
        .join("");

      playerSelect.innerHTML =
        '<option value="">Select Player</option>' + options;
    } catch (error) {
      console.error("Error loading players:", error);
      showError("Failed to load players - using sample data");

      // Fallback to sample players if API fails
      const samplePlayers = [
        { member_id: "1001", name: "Shashank Goud" },
        { member_id: "1002", name: "Virat Kohli" },
        { member_id: "1003", name: "Rohit Sharma" },
      ];

      const options = samplePlayers
        .map(
          (player) =>
            `<option value="${player.member_id}" data-name="${player.name}">${player.name}</option>`
        )
        .join("");

      playerSelect.innerHTML =
        '<option value="">Select Player</option>' + options;
    }
  }

  /**
   * Updates form status and UI elements based on current state
   */
  function updateFormStatus() {
    // Check if player is selected
    const playerSelected = playerSelect.value !== "";

    // Check if image is uploaded
    const imageUploaded = uploadedImageUrl !== null;

    // Check if all required fields are filled
    const formData = new FormData(playerForm);
    const requiredFields = [
      "player_name",
      "nationality",
      "role",
      "birth_date",
      "batting_style",
      "bowling_hand",
      "bowling_style",
      "debut_year",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData.get(field)
    );
    const allFieldsFilled = missingFields.length === 0;

    // Update helper text
    if (!playerSelected) {
      submitHelperText.textContent = "Please select a player to continue";
    } else if (!allFieldsFilled) {
      submitHelperText.textContent = `Please fill in all required fields (${missingFields
        .map((f) => f.replace("_", " "))
        .join(", ")})`;
    } else if (!imageUploaded) {
      submitHelperText.textContent = "Please upload a player image to continue";
    } else {
      submitHelperText.textContent = "Ready to submit! Click the button above.";
    }

    // Update submit button state
    const enableSubmit =
      playerSelected && allFieldsFilled && imageUploaded && !isUploading;
    submitBtn.disabled = !enableSubmit;

    // Update button style
    if (enableSubmit) {
      submitBtn.classList.remove("bg-gray-500");
      submitBtn.classList.add("bg-blue-500");
    } else {
      submitBtn.classList.add("bg-gray-500");
      submitBtn.classList.remove("bg-blue-500");
    }

    // Update progress steps
    if (imageStep && submitStep) {
      if (playerSelected && allFieldsFilled) {
        imageStep.classList.add("active");
      } else {
        imageStep.classList.remove("active");
      }

      if (imageUploaded) {
        imageStep.classList.add("completed");
        submitStep.classList.add("active");
      } else {
        imageStep.classList.remove("completed");
        submitStep.classList.remove("active");
      }
    }

    // Update image container style
    if (imageUploadContainer) {
      if (imageUploaded) {
        imageUploadContainer.classList.add("ready");
        imageUploadContainer.classList.remove("error");
      } else if (uploadError && !uploadError.classList.contains("hidden")) {
        imageUploadContainer.classList.add("error");
        imageUploadContainer.classList.remove("ready");
      }
    }
  }

  /**
   * Handles image upload process
   */
  async function handleImageUpload() {
    const file = imageUpload.files[0];
    if (!file) {
      showError("Please select an image to upload");
      return;
    }

    if (!playerSelect.value) {
      showError("Please select a player before uploading an image");
      return;
    }

    // Check file type
    if (!file.type.match("image.*")) {
      showError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Show uploading status
    isUploading = true;
    imageStatus.classList.remove("hidden");
    uploadingIndicator.classList.remove("hidden");
    uploadSuccess.classList.add("hidden");
    uploadError.classList.add("hidden");
    uploadImageBtn.disabled = true;
    updateFormStatus();

    try {
      console.log(
        "Compressing image for:",
        playerSelect.options[playerSelect.selectedIndex].text
      );

      // Compress image before upload
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("member_id", playerSelect.value);
      formData.append(
        "player_name",
        playerSelect.options[playerSelect.selectedIndex].text
      );
      console.log("Sending member_id:", playerSelect.value);
      console.log(
        "Sending player_name:",
        playerSelect.options[playerSelect.selectedIndex].text
      );

      console.log("Uploading to:", `${API_BASE_URL}/upload`);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${responseText}`);
      }

      // Parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!data.imageUrl) {
        throw new Error("No image URL in response");
      }

      uploadedImageUrl = data.imageUrl;

      // Update UI
      uploadingIndicator.classList.add("hidden");
      uploadSuccess.classList.remove("hidden");

      // Show preview
      imagePreview.innerHTML = `<img src="${uploadedImageUrl}" alt="Uploaded image" style="max-width: 100%;">`;
      imagePreview.classList.remove("hidden");

      console.log("Upload complete!");
    } catch (error) {
      console.error("Image upload error:", error);

      uploadingIndicator.classList.add("hidden");
      uploadError.classList.remove("hidden");

      // Show error message
      const errorSpan = uploadError.querySelector("span:last-child");
      if (errorSpan) {
        errorSpan.textContent = `Upload failed: ${error.message}`;
      }
    } finally {
      isUploading = false;
      uploadImageBtn.disabled = false;
      updateFormStatus();
    }
  }

  /**
   * Handles form submission
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (!uploadedImageUrl) {
      showError("Please upload an image first");
      return;
    }

    // Check all required fields again
    const formData = new FormData(playerForm);
    const requiredFields = [
      "player_name",
      "nationality",
      "role",
      "birth_date",
      "batting_style",
      "bowling_hand",
      "bowling_style",
      "debut_year",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData.get(field)
    );
    if (missingFields.length > 0) {
      showError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    // Add the uploaded image URL
    formData.append("image_path", uploadedImageUrl);

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      // Get all form values
      const formObject = {};
      const formData = new FormData(playerForm);
      formData.forEach((value, key) => {
        formObject[key] = value;
      });

      const selectedPlayerName =
        playerSelect.options[playerSelect.selectedIndex].text;

      // Add member_id from the select element and the image path
      formObject.member_id = playerSelect.value;
      formObject.player_name = selectedPlayerName;
      formObject.image_path = uploadedImageUrl;

      console.log("Submitting player data:", formObject);

      // Send as JSON with proper Content-Type header
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      });

      // Check response and handle accordingly
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(
          result.error || `Submission failed (${response.status})`
        );
      }

      showSuccess(result.message || "Player details saved successfully!");

      // Reset form
      playerForm.reset();
      uploadedImageUrl = null;
      imageStatus.classList.add("hidden");
      imagePreview.innerHTML = "";
      imagePreview.classList.add("hidden");
      updateFormStatus();
    } catch (error) {
      console.error("Submit error:", error);
      showError(error.message);
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  }

  /**
   * Shows error notification
   */
  function showError(message) {
    console.error("Error:", message);

    // Remove any existing notifications first
    document
      .querySelectorAll(".notification-toast")
      .forEach((el) => el.remove());

    // Create error notification
    const errorElement = document.createElement("div");
    errorElement.className =
      "fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md shadow-lg z-50 notification-toast";
    errorElement.textContent = message;
    document.body.appendChild(errorElement);

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className = "absolute top-1 right-2 text-white";
    closeBtn.onclick = () => errorElement.remove();
    errorElement.appendChild(closeBtn);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(errorElement)) {
        errorElement.remove();
      }
    }, 5000);
  }

  /**
   * Shows success notification
   */
  function showSuccess(message) {
    console.log("Success:", message);

    // Remove any existing notifications first
    document
      .querySelectorAll(".notification-toast")
      .forEach((el) => el.remove());

    // Create success notification
    const successElement = document.createElement("div");
    successElement.className =
      "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg z-50 notification-toast";
    successElement.textContent = message;
    document.body.appendChild(successElement);

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className = "absolute top-1 right-2 text-white";
    closeBtn.onclick = () => successElement.remove();
    successElement.appendChild(closeBtn);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(successElement)) {
        successElement.remove();
      }
    }, 5000);
  }

  // Event listeners
  playerSelect.addEventListener("change", updateFormStatus);
  playerForm.querySelectorAll("select, input").forEach((input) => {
    input.addEventListener("change", updateFormStatus);
  });

  // Image upload button click handler
  uploadImageBtn.addEventListener("click", handleImageUpload);

  // Form submission handler
  playerForm.addEventListener("submit", handleSubmit);

  // Initialize
  await loadPlayers();
  updateFormStatus();

  // Initially disable the submit button until image is uploaded
  if (submitBtn) {
    submitBtn.disabled = true;
  }
});
