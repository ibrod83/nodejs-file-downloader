(async()=>{



    const thenable = {
        then: async function(onFulfilled) {
            debugger;
          console.log('before')  
          await timeout(6000)
          console.log('after')
          onFulfilled('yoyoyoyoyoyoyoyoyoy')
        //   setTimeout(() => onFulfilled(42), 5000);
        }
      };
      


    const data = await thenable
    console.log(data)
})()

function timeout(mil){
    return new Promise((res)=>setTimeout(()=>res(),mil))
}



