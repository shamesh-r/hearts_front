// Small responsive helper utilities.
class Responsive {
  /**
   * True when viewport width is under mobile breakpoint.
   */
  static isMobile() {
    // Treat widths below tablet breakpoint as mobile.
    return window.innerWidth < 768;
  }
}
