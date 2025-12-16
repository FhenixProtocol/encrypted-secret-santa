"use client";

export const AsciiSantaBackground = () => {
  // ASCII art Santa hat pattern
  const santaHat = `
                    *
                   /|\\
                  / | \\
                 /  |  \\
                /   |   \\
               /    |    \\
              /     |     \\
             /      |      \\
            /       |       \\
           /        |        \\
          /         |         \\
         /          |          \\
        /           |           \\
       /            |            \\
      /             |             \\
     /______________|______________\\
     |                              |
     |______________________________|
`;

  // Repeat the pattern to fill the background
  const repeatedPattern = Array(6).fill(santaHat).join('\n');

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <pre
        className="text-pastel-pink/[0.08] text-[10px] leading-tight font-mono whitespace-pre select-none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {repeatedPattern}
      </pre>
    </div>
  );
};
