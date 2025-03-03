export const adjustFontSize = (containerRef: React.RefObject<HTMLElement>) => {
  if (containerRef.current) {
    const rows = Array.from(containerRef.current.getElementsByClassName('official-row'));
    rows.forEach(row => {
      const emailCell = row.getElementsByClassName('email-cell')[0] as HTMLElement;
      if (emailCell) {
        let fontSize = 16; // Default font size
        while (emailCell.scrollWidth > emailCell.clientWidth && fontSize > 10) {
          fontSize -= 1;
          emailCell.style.fontSize = `${fontSize}px`;
        }
      }
    });
  }
};
