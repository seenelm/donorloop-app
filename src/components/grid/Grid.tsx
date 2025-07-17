import React, { useRef, useEffect } from 'react';
import './grid.css';

const Grid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const gridSize = 30;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    const items = [{ x: 100, y: 100, size: 10 }];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ccc';

      const cols = Math.ceil(width / gridSize) + 2;
      const rows = Math.ceil(height / gridSize) + 2;

      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gridSize + (offsetX % gridSize);
          const y = j * gridSize + (offsetY % gridSize);
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      items.forEach((item) => {
        ctx.beginPath();
        ctx.arc(item.x + offsetX, item.y + offsetY, item.size, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
      dragStart = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      offsetX += e.clientX - dragStart.x;
      offsetY += e.clientY - dragStart.y;
      dragStart = { x: e.clientX, y: e.clientY };
      draw();
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      draw();
    };

    // Initial draw
    draw();

    // Add listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="grid-canvas" />;
};

export default Grid;
