import { CartLinesUpdateEvent } from '@shopify/events';
document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('[data-ps-protection-form]')) return;
  event.preventDefault();
  const button = form.querySelector('button');
  if (!button || button.disabled) return;
  const error = form.closest('.ps-protection')?.querySelector('[data-ps-protection-error]');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  if (error) error.textContent = '';
  const data = new FormData(form);
  const id = String(data.get('id'));
  const removing = form.dataset.action === 'remove';
  const root = window.Shopify?.routes?.root || '/';
  const deferred = CartLinesUpdateEvent.createPromise();
  form.dispatchEvent(new CartLinesUpdateEvent({action: removing ? 'remove' : 'add', context:'cart', lines:[removing ? {id,quantity:0} : {merchandiseId:id,quantity:1}], promise:deferred.promise}));
  try {
    data.set('sections','cart-drawer-section');
    data.set('sections_url',location.pathname);
    const response = await fetch(root+(removing?'cart/change.js':'cart/add.js'),{method:'POST',body:data,headers:{Accept:'application/json'}});
    const result = await response.json();
    if (!response.ok || result.status || result.errors) throw new Error('Unable to update shipping protection.');
    const cartResponse = await fetch(root+'cart.js',{headers:{Accept:'application/json'}});
    if (!cartResponse.ok || !result.sections?.['cart-drawer-section']) { location.reload(); return; }
    const cart = await cartResponse.json();
    deferred.resolve({cart:CartLinesUpdateEvent.createCartFromAjaxResponse(cart),detail:{items:cart.items,itemCount:cart.item_count,sections:result.sections,source:'presela-protection',didError:false}});
    if (document.activeElement === button) requestAnimationFrame(() => requestAnimationFrame(() => {
      const replacement = document.querySelector('[data-ps-protection-form] .ps-protection-switch');
      if (replacement && document.activeElement === document.body) replacement.focus();
    }));
  } catch (err) {
    deferred.reject(err);
    if (error) error.textContent = 'Unable to update your cart. Please check your cart and try again.';
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});
