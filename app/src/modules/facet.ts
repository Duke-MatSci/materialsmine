const Facet = function (): void {
  initDragElement();
  initResizeElement();
};

function initDragElement(): void {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  const facets = document.getElementsByClassName('facet');
  let elmnt: HTMLElement | null = null;
  let currentZIndex = 100; // TODO reset z index when a threshold is passed

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i] as HTMLElement;
    const header = getHeader(facet);

    facet.onmousedown = (): void => {
      facet.style.zIndex = '' + ++currentZIndex;
    };

    if (header) {
      (header as any).parentFacet = facet;
      header.onmousedown = (e: MouseEvent) => dragMouseDown.call(header, e);
    }
  }

  function dragMouseDown(this: HTMLElement, e: MouseEvent): void {
    elmnt = (this as any).parentFacet;
    if (elmnt) {
      elmnt.style.zIndex = '' + ++currentZIndex;
    }

    e = e || (window.event as MouseEvent);
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent): void {
    if (!elmnt) {
      return;
    }

    e = e || (window.event as MouseEvent);
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
    elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
  }

  function closeDragElement(): void {
    /* stop moving when mouse button is released: */
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function getHeader(element: HTMLElement): HTMLElement | null {
    const headerItems = element.getElementsByClassName('facet-header');

    if (headerItems.length === 1) {
      return headerItems[0] as HTMLElement;
    }

    return null;
  }
}

function initResizeElement(): void {
  const facets = document.getElementsByClassName('facet');
  let element: HTMLElement | null = null;
  let startX: number, startY: number, startWidth: number, startHeight: number;

  for (let i = 0; i < facets.length; i++) {
    const p = facets[i] as HTMLElement;

    const right = document.createElement('div');
    right.className = 'resizer resizer-right u_height--max';
    p.appendChild(right);
    right.addEventListener('mousedown', initDrag, false);
    (right as any).parentFacet = p;

    const bottom = document.createElement('div');
    bottom.className = 'resizer resizer-bottom u_width--max';
    p.appendChild(bottom);
    bottom.addEventListener('mousedown', initDrag, false);
    (bottom as any).parentFacet = p;

    const both = document.createElement('div');
    both.className = 'resizer resizer-both';
    p.appendChild(both);
    both.addEventListener('mousedown', initDrag, false);
    (both as any).parentFacet = p;
  }

  function initDrag(this: HTMLElement, e: MouseEvent): void {
    element = (this as any).parentFacet;
    startX = e.clientX;
    startY = e.clientY;
    if (element) {
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
    }
    document.addEventListener('mousemove', doDrag, false);
    document.addEventListener('mouseup', stopDrag, false);
  }

  function doDrag(e: MouseEvent): void {
    if (element) {
      element.style.width = startWidth + (e.clientX - startX) + 'px';
      element.style.height = startHeight + (e.clientY - startY) + 'px';
    }
  }

  function stopDrag(): void {
    document.removeEventListener('mousemove', doDrag, false);
    document.removeEventListener('mouseup', stopDrag, false);
  }
}

export default Facet;
