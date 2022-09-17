
const deleteProduct = async (btn) => {
    // console.log(document.querySelector('[name=productId]').value)
    const productId = btn.parentNode.querySelector('[name=productId]').value
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value

    const productElement = btn.closest('article')
    try {
        const result = await fetch('/admin/products/' + productId, {
            method: 'delete',
            headers: {
                'csrf-token': csrf
            }
        })
        const data = await result.json()     
        console.log(data)
        productElement.remove()
    } catch (error) {
        console.log(error)
    }
}