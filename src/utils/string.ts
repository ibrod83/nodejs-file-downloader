const capitalize = (s: string): string => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  
  const isJson = (input: string): boolean => {
    try {
      JSON.parse(input);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  export  {
    capitalize,
    isJson,
  };
  