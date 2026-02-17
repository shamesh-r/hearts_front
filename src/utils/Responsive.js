// Small responsive helper utilities.
class Responsive {
  static isMobile() {
    // Treat widths below tablet breakpoint as mobile.
    return window.innerWidth < 768;
  }
}
