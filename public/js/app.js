/**
 * app.js - Main application logic
 * CTA button behavior, form toggle, pixel initialization
 */
(function() {
  'use strict';

  // Initialize Meta Pixel (replace with your actual Pixel ID)
  if (window.Pixel) {
    window.Pixel.init('YOUR_PIXEL_ID_HERE');
  }

  // --- CTA Button Handlers ---

  // Call Now button
  var btnCall = document.getElementById('btnCall');
  var headerPhone = document.getElementById('headerPhone');

  function onCallClick() {
    if (window.Pixel) window.Pixel.callClicked();
  }

  if (btnCall) btnCall.addEventListener('click', onCallClick);
  if (headerPhone) headerPhone.addEventListener('click', onCallClick);

  // Schedule a Call button
  var btnSchedule = document.getElementById('btnSchedule');
  var formSection = document.getElementById('formSection');
  var formVisible = false;

  if (btnSchedule && formSection) {
    btnSchedule.addEventListener('click', function() {
      formVisible = !formVisible;

      if (formVisible) {
        formSection.style.display = 'block';
        // Smooth scroll to form
        setTimeout(function() {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        btnSchedule.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Hide Form';
      } else {
        formSection.style.display = 'none';
        btnSchedule.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Schedule a Free Debt Consultation';
      }

      if (window.Pixel) window.Pixel.scheduleClicked();
    });
  }

  // Learn More button
  var btnLearn = document.getElementById('btnLearn');
  if (btnLearn) {
    btnLearn.addEventListener('click', function() {
      if (window.Pixel) window.Pixel.learnMoreClicked();
    });
  }
})();
