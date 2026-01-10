# DemoProWin 🖊️

**DemoProWin** is a professional screen annotation tool for Windows developers and presenters. Built with Electron, it offers a seamless, transparent overlay that lets you draw, highlight, and demonstrate concepts directly on your desktop.

## 🚀 Features

*   **Always-On-Top Palette**: A floating, glassmorphic toolbar that never gets in your way but is always there when you need it.
*   **Versatile Tools**:
    *   🖍️ **Pen**: Smooth freehand drawing.
    *   ➡️ **Arrow**: Perfect for pointing out specific UI elements.
    *   ⏹️ **Rectangle**: Box areas of interest.
    *   ⭕ **Circle**: Highlight buttons or features.
    *   👆 **Cursor**: Instantly switch back to interacting with your apps.
*   **Color Control**: Switch between 🔴 Red, 🔵 Blue, 🟢 Green, 🟡 Yellow, and ⚪ White.
*   **History Stack**: Made a mistake? **Undo** and **Redo** support included.
*   **Smart Clearing**:
    *   Hit the **Trash Can** to wipe the screen.
    *   Press **`Esc`** to instantly clear annotations and release the mouse cursor.

## 📦 Installation

To build and run this project locally:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/Drfiya/DemoProWin.git
    cd DemoProWin
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the app**
    ```bash
    npm start
    ```

## 🛠️ Technology Stack

*   **Electron**: For cross-platform desktop integration.
*   **HTML5 Canvas**: High-performance 2D rendering.
*   **IPC**: Robust communication between the palette and overlay windows.

## 📝 License

This project is licensed under the ISC License.
