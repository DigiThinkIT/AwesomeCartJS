// demo catalog from array
var demoCatalog = []
var colors = ['000', 'fff']
for(var i=1; i <= 9; i++) {
  var txtcolor = colors[i%2]
  var bkcolor = colors[(i+1)%2]
  demoCatalog.push({
    sku: 'sku00'+i,
    name: 'Demo Item ' + i,
    min: 1,
    imageUrl: 'http://placehold.it/400x250/?text400x250',
    productUrl: '/product.html#sku=sku00' + i,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras congue, erat vel molestie pharetra, enim risus euismod libero, et aliquet neque libero ac dui.',
    price: Math.floor(Math.random() * 10) + 10,
    tags: ['demo'],
    detail: {
      sections: [
        {
          background_image_url: 'https://unsplash.it/1960/400/?random',
          content: [
            {
              html: [
                '<ul><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li></ul>',
                '<img src="http://placehold.it/200x200/?Product"/>'
              ]
            }
          ]
        },
        {
          content: [
            {
              html: [
                '<ul><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li></ul>',
                '<img src="http://placehold.it/200x200/?Product"/>'
              ]
            }
          ]
        },
        {
          background_image_url: 'https://unsplash.it/1960/400/?random',
          content: [
            {
              html: [
                '<ul><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li></ul>',
                '<img src="http://placehold.it/200x200/?Product"/>'
              ]
            }
          ]
        }
      ]
    }
  })
}

// Initialize awc cart
var cart = new awc.AwesomeCart({
  storeAdapter: new awc.DemoStoreaAdapter(demoCatalog),
  sessionStoreUrl: 'http://localhost:8080/awc'
});

// create an embeded cart feed
cart.newCartFeed('cart1', {
  container: '#cart-embed-content',
  tpl: awc.getTemplate('templates/cart_embeded.html')
})

// manage embeded cart item counter
cart.on('updated', function() {
  if ( cart.totalCount != cart.lastTotalCount ) {
    if ( cart.totalCount > 0 ) {
      $('.cart-count').fadeIn('slow')
      $('.cart-count .content').text(cart.totalCount)
      $('.cart-count').animateCss('flip');
    } else {
      $('.cart-count').fadeOut('slow')
    }
  }
})
