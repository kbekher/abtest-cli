import { hotjar, exec } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-0003
*/

(() => {
  exec('ux0003');

  const PREFIX = 'ux0003__';

  hotjar(PREFIX + 'v0');

})();
