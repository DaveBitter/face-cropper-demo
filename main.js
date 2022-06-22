import "./style.css";

class FaceCropper {
  intrinsicImageNodeSize = { width: null, height: null };
  faces = [];
  faceDetector = new window.FaceDetector();
  imageContainerNode = null;
  imageNode = null;
  options = {
    drawFaceBoundingBox: false,
    setObjectFit: true,
    setObjectPosition: true,
  };

  constructor(imageNode, imageContainerNode, options) {
    this.imageNode = imageNode;
    this.imageContainerNode = imageContainerNode;
    this.options = options;

    this.#init();
  }

  #drawFaceBoundingBox() {
    this.faces.forEach(({ boundingBox }) => {
      const { width: imageNodeWidth, height: imageNodeHeight } =
        this.imageNode.getBoundingClientRect();

      const { width, height, left, top } =
        this.#mapFaceDetectionBoundingBoxFromIntrinsicSize(boundingBox);

      const box = document.createElement("span");

      box.style.position = "absolute";
      box.style.top = `${Math.floor((top / imageNodeHeight) * 100)}%`;
      box.style.left = `${Math.floor((left / imageNodeWidth) * 100)}%`;
      box.style.width = `${Math.floor((width / imageNodeWidth) * 100)}%`;
      box.style.height = `${Math.floor((height / imageNodeHeight) * 100)}%`;

      this.imageContainerNode.appendChild(box);
    });
  }

  #setObjectCrop() {
    const boundingBox = this.#getOuterBoundingBoxFromFaces();
    const { width: imageNodeWidth, height: imageNodeHeight } =
      this.imageNode.getBoundingClientRect();

    const { top, right } =
      this.#mapFaceDetectionBoundingBoxFromIntrinsicSize(boundingBox);

    const { setObjectFit, setObjectPosition } = this.options;

    if (setObjectPosition) {
      this.imageNode.style.objectPosition = `${Math.floor(
        (right / imageNodeWidth) * 100
      )}% ${Math.floor((top / imageNodeHeight) * 100)}%`;
    }

    if (setObjectFit) {
      this.imageNode.style.objectFit = "cover";
      this.imageNode.style.aspectRatio = "16 / 9";
    }
  }

  #mapFaceDetectionBoundingBoxFromIntrinsicSize(faceDetectionBoundingBox) {
    const imageNodeBoundingBox = this.imageNode.getBoundingClientRect();

    return {
      top:
        (faceDetectionBoundingBox.top / this.intrinsicImageNodeSize.height) *
        imageNodeBoundingBox.height,
      bottom:
        (faceDetectionBoundingBox.bottom / this.intrinsicImageNodeSize.height) *
        imageNodeBoundingBox.height,
      left:
        (faceDetectionBoundingBox.left / this.intrinsicImageNodeSize.width) *
        imageNodeBoundingBox.width,
      right:
        (faceDetectionBoundingBox.right / this.intrinsicImageNodeSize.width) *
        imageNodeBoundingBox.width,
      width:
        (faceDetectionBoundingBox.width / this.intrinsicImageNodeSize.width) *
        imageNodeBoundingBox.width,
      height:
        (faceDetectionBoundingBox.height / this.intrinsicImageNodeSize.height) *
        imageNodeBoundingBox.height,
    };
  }

  #getOuterBoundingBoxFromFaces() {
    const sortedFacesByTop = this.faces.sort(
      (a, b) => b.boundingBox.top - a.boundingBox.top
    );
    const sortedFacesByBottom = this.faces.sort(
      (a, b) => b.boundingBox.top - a.boundingBox.top
    );
    const sortedFacesByLeft = this.faces.sort(
      (a, b) => b.boundingBox.left - a.boundingBox.left
    );
    const sortedFacesByRight = this.faces.sort(
      (a, b) => b.boundingBox.right - a.boundingBox.right
    );

    const top = sortedFacesByTop.at(-1).boundingBox.top;
    const bottom = sortedFacesByBottom.at(0).boundingBox.bottom;
    const left = sortedFacesByLeft.at(-1).boundingBox.left;
    const right = sortedFacesByRight.at(0).boundingBox.right;

    return {
      top,
      bottom,
      left,
      right,
      width: right - left,
      height: bottom - top,
    };
  }

  async #getFaces() {
    this.faces = await this.faceDetector.detect(this.imageNode);
  }

  async #getIntrinsicImageNodeSize() {
    const that = this;

    return new Promise((resolve) => {
      var url = this.imageNode.src;
      var img = new Image();
      img.onload = function () {
        const { width, height } = img;

        that.intrinsicImageNodeSize = { width, height };
        resolve();
      };

      img.src = url;
    });
  }

  #showNotSupportedOverlay() {
    document.body.setAttribute("data-is-supported", "false");
  }

  #checkIsSupported() {
    return typeof window.FaceDetector !== "undefined";
  }

  async #init() {
    if (this.#checkIsSupported()) {
      const { drawFaceBoundingBox, setObjectFit, setObjectPosition } =
        this.options;

      await this.#getIntrinsicImageNodeSize();
      await this.#getFaces();
      drawFaceBoundingBox && this.#drawFaceBoundingBox();
      (setObjectPosition || setObjectFit) && this.#setObjectCrop();
    } else {
      this.#showNotSupportedOverlay();
    }
  }
}

const imageContainerNodes = [
  ...document.querySelectorAll("[data-image-container]"),
];

imageContainerNodes.forEach((imageContainerNode) => {
  const imageNode = imageContainerNode.querySelector("[data-image]");

  const { drawFaceBoundingBox, setObjectFit, setObjectPosition } =
    imageNode.dataset;

  new FaceCropper(imageNode, imageContainerNode, {
    drawFaceBoundingBox: !!drawFaceBoundingBox,
    setObjectFit: !!setObjectFit,
    setObjectPosition: !!setObjectPosition,
  });
});
