Drop your product photos here.

Name each file after the product id from assets/js/catalog.js, for example:

    rice50.jpg        -> product id 'rice50'
    ftilapia.jpg      -> product id 'ftilapia'
    coke2l.jpg        -> product id 'coke2l'

Square images (800 x 800 or 1000 x 1000) work best.

Then open assets/js/catalog.js and change the art() function near the bottom from
the built-in placeholder to your real files:

    function art(p) {
      return 'assets/img/products/' + p.id + '.jpg';
    }

Delete this text file once your photos are in place.
