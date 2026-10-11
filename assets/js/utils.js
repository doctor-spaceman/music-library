/**
 * Delays an input to prevent a callback from firing excessively.
 * @function
 * @param {function} cb - The callback function.
 * @param {number} delay - The delay in milliseconds.
 */
export const debounce = (cb, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      cb(...args);
    }, delay);
  }
}

/**
 * Formats a timestamp into a human-readable string.
 * @function
 * @param {string} timestamp - The timestamp to convert.
 */
export const formatTimestamp = (timestamp) => {
  const msTimestamp = timestamp * 1000;
  const dateObj = new Date(msTimestamp);
  const dateFormat = dateObj.toLocaleString('en-US', {month: 'long', day: 'numeric'});
  return dateFormat;
}

/**
 * Adds a localStorage entry with an expiration date.
 * @function
 * @param {string} key - The name of the localStorage entry.
 * @param {string} value - The information to store (likely stringified JSON).
 * @param {number} ttl - The duration of validity in milliseconds.
 */
export const setLocalStorageWithExpiry = (key, value, ttl = 0) => {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
  };
  if (ttl > 0) {
    item.expiry = now.getTime() + ttl;
  }
  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Checks a localStorage entry that has an expiration date.
 * @function
 * @param {string} key - The name of the localStorage entry.
 */
export const getLocalStorageWithExpiry = (key) => {  
  // Get and parse the item
  let item = window.localStorage?.getItem(key)  

  // If the item doesn't exist, return null
  if (!item || !Object.keys(item).length) return null;

  let itemParsed = {};
  try {
    itemParsed = JSON.parse(item);
  } catch (error) {
    console.warn(`Could not parse ${itemParsed}.`);
    console.log(error.message);
  }

  // Compare the expiry time of the item with the current time.
  // If the item is expired, delete the item and return null
  const now = new Date();
  if (itemParsed?.expiry) {
    if (typeof itemParsed.expiry === 'number') {
      if (now.getTime() > itemParsed.expiry) {
        window.localStorage?.removeItem(key);
        return null;
      }
    }
  }

  try {
    return JSON.parse(itemParsed.value);
  } catch (error) {
    return itemParsed.value;
  }
}

/** Simple check for a "mobile" breakpoint based on the viewport width. */
export const isMobile = () => {
  return window.innerWidth < 768;
}