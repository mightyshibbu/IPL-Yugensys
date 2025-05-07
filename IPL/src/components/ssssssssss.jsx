
/* Rotating image */
.rotating-image-container {
  position: fixed;
  top: 75%;
  left: 53%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.rotating-image {
  width: 150vh;
  height: 1000vh;
  max-width: 120vw;
  max-height: 20vw;
  object-fit: contain;
  animation: rotate 300s linear infinite;
  opacity: 0.7;
}
