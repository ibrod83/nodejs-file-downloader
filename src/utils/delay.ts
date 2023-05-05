function createDelay(mil: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, mil);
    });
  }
  
  export  {
    createDelay,//
  };
  