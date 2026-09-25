import { useEffect, useState } from "react";
import axios from "axios";
import Auth from "./Auth";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ArrowRight,
  Star,
  Truck,
  ShieldCheck,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  XCircle,
  CheckCircle,
  PackageCheck,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5293/api";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("shopsphere_user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("shopsphere_user");
      return null;
    }
  });

  const currentUserId = currentUser?.userId || null;

  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [orderSuccess, setOrderSuccess] = useState(null);

  // =========================
  // FETCH PRODUCTS
  // =========================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/Product?page=1&pageSize=20`
      );

      setProducts(response.data.data || []);
    } catch (err) {
      console.error("Product API Error:", err);
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH CART
  // =========================

  const fetchCart = async () => {
    if (!currentUserId) {
      setCart([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/Cart/${currentUserId}`
      );

      setCart(response.data.items || []);
    } catch (err) {
      console.error("Cart API Error:", err);
    }
  };

  // =========================
  // FETCH ORDERS
  // =========================

  const fetchOrders = async () => {
    if (!currentUserId) {
      setOrders([]);
      return;
    }

    try {
      setOrdersLoading(true);

      const response = await axios.get(
        `${API_URL}/OrderHistory/${currentUserId}`
      );

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Orders API Error:", err);
      setError("Unable to load your orders.");

      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setOrdersLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchCart();
  }, [currentUserId]);

  // =========================
  // AUTH
  // =========================

  const handleLogin = (user) => {
    setCurrentUser(user);
    setAuthOpen(false);
    setMessage(`Welcome, ${user.fullName}!`);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("shopsphere_user");
    setCurrentUser(null);
    setOrders([]);
    setCart([]);
    setOrdersOpen(false);
    setAuthOpen(false);
    setMessage("You have been logged out.");
    setTimeout(() => setMessage(""), 2500);
  };

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = async (productId) => {
    if (!currentUserId) {
      setAuthOpen(true);
      return;
    }

    try {
      setCartLoading(true);
      setError("");

      await axios.post(
        `${API_URL}/Cart/${currentUserId}`,
        {
          productId,
          quantity: 1,
        }
      );

      await fetchCart();

      setMessage("Product added to cart.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error("Add Cart Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to add product to cart."
      );

      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setCartLoading(false);
    }
  };

  // =========================
  // UPDATE CART
  // =========================

  const updateCartQuantity = async (
    cartItemId,
    quantity
  ) => {
    if (!currentUserId || quantity < 1) return;

    try {
      await axios.put(
        `${API_URL}/Cart/${currentUserId}/${cartItemId}`,
        quantity,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await fetchCart();
    } catch (err) {
      console.error("Update Cart Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update cart."
      );

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // =========================
  // REMOVE FROM CART
  // =========================

  const removeFromCart = async (cartItemId) => {
    if (!currentUserId) return;

    try {
      await axios.delete(
        `${API_URL}/Cart/${currentUserId}/${cartItemId}`
      );

      await fetchCart();

      setMessage("Product removed from cart.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error("Remove Cart Error:", err);

      setError("Unable to remove product.");

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // =========================
  // CLEAR CART
  // =========================

  const clearCart = async () => {
    if (!currentUserId) return;

    try {
      await axios.delete(
        `${API_URL}/Cart/${currentUserId}`
      );

      await fetchCart();

      setMessage("Cart cleared successfully.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error("Clear Cart Error:", err);

      setError("Unable to clear cart.");

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // =========================
  // CHECKOUT
  // =========================

  const checkout = async () => {
    if (!currentUserId) {
      setCartOpen(false);
      setAuthOpen(true);
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/Order/checkout/${currentUserId}`
      );

      setOrderSuccess(response.data);

      setCartOpen(false);

      await fetchCart();
      await fetchProducts();
    } catch (err) {
      console.error("Checkout Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to complete purchase."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================
  // CART CALCULATIONS
  // =========================

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartSubtotal = cart.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  return (
    <div className="app">

      {authOpen && (
        <Auth
          onLogin={handleLogin}
          onClose={() => setAuthOpen(false)}
        />
      )}

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="navbar">
        <div className="nav-container">

          <div className="logo">
            <span className="logo-icon">S</span>
            ShopSphere
          </div>

          <nav
            className={
              menuOpen
                ? "nav-links open"
                : "nav-links"
            }
          >
            <a
              href="#home"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>

            <a
              href="#products"
              onClick={() => setMenuOpen(false)}
            >
              Products
            </a>

            <a
              href="#categories"
              onClick={() => setMenuOpen(false)}
            >
              Categories
            </a>

            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
            >
              About
            </a>
          </nav>

          <div className="nav-actions">

            <div className="search-box">
              <Search size={19} />

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <button
              className="icon-button"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart size={21} />

              {cartItemCount > 0 && (
                <span className="cart-count">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              className="icon-button"
              onClick={() => {
                if (currentUser) {
                  setOrdersOpen(true);
                  fetchOrders();
                } else {
                  setAuthOpen(true);
                }
              }}
              title={currentUser ? currentUser.fullName : "Login"}
            >
              <User size={21} />
            </button>

            <button
              className="mobile-menu"
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
            >
              {menuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* =========================
          SUCCESS TOAST
      ========================= */}

      {message && (
        <div className="toast success-toast">
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* =========================
          ERROR TOAST
      ========================= */}

      {error && (
        <div className="toast error-toast">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* =========================
          MAIN
      ========================= */}

      <main>

        {/* HERO */}

        <section
          className="hero"
          id="home"
        >
          <div className="hero-content">

            <p className="hero-tag">
              WELCOME TO SHOPSPHERE
            </p>

            <h1>
              Everything you need,
              <span>
                all in one place.
              </span>
            </h1>

            <p className="hero-description">
              Discover quality products, great
              prices, and a seamless shopping
              experience built for you.
            </p>

            <div className="hero-buttons">

              <a
                href="#products"
                className="primary-button"
              >
                Shop Now
                <ArrowRight size={19} />
              </a>

              <a
                href="#categories"
                className="secondary-button"
              >
                Explore Categories
              </a>

            </div>
          </div>

          <div className="hero-image">

            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85"
              alt="Shopping"
            />

          </div>
        </section>

        {/* FEATURES */}

        <section className="features">

          <div className="feature-card">
            <Truck size={28} />

            <div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery</p>
            </div>
          </div>

          <div className="feature-card">
            <ShieldCheck size={28} />

            <div>
              <h3>Secure Shopping</h3>
              <p>Your data stays protected</p>
            </div>
          </div>

          <div className="feature-card">
            <CreditCard size={28} />

            <div>
              <h3>Easy Payment</h3>
              <p>Simple and secure checkout</p>
            </div>
          </div>

          <div className="feature-card">
            <Star size={28} />

            <div>
              <h3>Quality Products</h3>
              <p>Products you'll love</p>
            </div>
          </div>

        </section>

        {/* PRODUCTS */}

        <section
          className="products-section"
          id="products"
        >

          <div className="section-heading">

            <div>
              <p className="section-tag">
                OUR COLLECTION
              </p>

              <h2>Featured Products</h2>
            </div>

            <button className="view-all-button">
              View All
              <ArrowRight size={18} />
            </button>

          </div>

          {loading && (
            <div className="empty-search">
              <h3>Loading products...</h3>
              <p>
                Please wait while we fetch products.
              </p>
            </div>
          )}

          {!loading &&
            filteredProducts.length === 0 && (
              <div className="empty-search">
                <h3>No products found</h3>
                <p>
                  Try searching for another product.
                </p>
              </div>
            )}

          {!loading &&
            filteredProducts.length > 0 && (
              <div className="product-grid">

                {filteredProducts.map((product) => (

                  <div
                    className="product-card"
                    key={product.id}
                  >

                    <div className="product-image">

                      <img
                        src={
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={product.name}
                      />

                      <span className="product-badge">
                        {product.stockQuantity > 0
                          ? "IN STOCK"
                          : "SOLD OUT"}
                      </span>

                    </div>

                    <div className="product-info">

                      <p className="product-category">
                        {product.categoryName ||
                          "Product"}
                      </p>

                      <h3>{product.name}</h3>

                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          lineHeight: "1.5",
                          marginBottom: "12px",
                        }}
                      >
                        {product.description}
                      </p>

                      <div className="rating">

                        <Star
                          size={16}
                          fill="currentColor"
                        />

                        <span>4.8</span>

                      </div>

                      <div className="product-bottom">

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toLocaleString("en-IN")}
                        </strong>

                        <button
                          className="add-button"
                          disabled={
                            product.stockQuantity <= 0 ||
                            cartLoading
                          }
                          onClick={() =>
                            addToCart(product.id)
                          }
                        >
                          <ShoppingCart size={18} />

                          {product.stockQuantity > 0
                            ? "Add"
                            : "Sold Out"}
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>
            )}

        </section>

        {/* CATEGORIES */}

        <section
          className="categories-section"
          id="categories"
        >

          <div className="section-heading centered">

            <p className="section-tag">
              SHOP BY CATEGORY
            </p>

            <h2>Explore Categories</h2>

          </div>

          <div className="category-grid">

            <div className="category-card">

              <img
                src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=700&q=80"
                alt="Electronics"
              />

              <div>
                <h3>Electronics</h3>
                <p>
                  Latest gadgets & accessories
                </p>
              </div>

            </div>

            <div className="category-card">

              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80"
                alt="Fashion"
              />

              <div>
                <h3>Fashion</h3>
                <p>
                  Style for every occasion
                </p>
              </div>

            </div>

            <div className="category-card">

              <img
                src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80"
                alt="Lifestyle"
              />

              <div>
                <h3>Lifestyle</h3>
                <p>
                  Make everyday better
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* NEWSLETTER */}

        <section className="newsletter">

          <div>

            <p className="section-tag">
              STAY UPDATED
            </p>

            <h2>
              Get the latest deals & updates
            </h2>

            <p>
              Subscribe to receive product
              launches, special offers and more.
            </p>

          </div>

          <div className="newsletter-form">

            <input
              type="email"
              placeholder="Enter your email"
            />

            <button>
              Subscribe
            </button>

          </div>

        </section>

      </main>

      {/* =========================
          FOOTER
      ========================= */}

      <footer
        className="footer"
        id="about"
      >

        <div className="footer-container">

          <div>

            <div className="logo footer-logo">

              <span className="logo-icon">
                S
              </span>

              ShopSphere

            </div>

            <p>
              A modern shopping experience
              designed to make online shopping
              simple.
            </p>

          </div>

          <div>
            <h4>Shop</h4>

            <a href="#products">
              Products
            </a>

            <a href="#categories">
              Categories
            </a>

            <a href="#home">
              Offers
            </a>
          </div>

          <div>
            <h4>Support</h4>

            <a href="#about">
              Contact
            </a>

            <a href="#about">
              FAQ
            </a>

            <a href="#about">
              Shipping
            </a>
          </div>

          <div>
            <h4>Account</h4>

            <button
              className="footer-link-button"
              onClick={() => {
                setOrdersOpen(true);
                fetchOrders();
              }}
            >
              My Orders
            </button>
          </div>

        </div>

        <div className="footer-bottom">
          © 2026 ShopSphere. All rights reserved.
        </div>

      </footer>

      {/* =========================
          CART SIDEBAR
      ========================= */}

      {cartOpen && (

        <div
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        >

          <div
            className="cart-sidebar"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>
                <h2>Your Cart</h2>

                <p>
                  {cartItemCount}{" "}
                  {cartItemCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                className="cart-close"
                onClick={() =>
                  setCartOpen(false)
                }
              >
                <X size={22} />
              </button>

            </div>

            {cart.length === 0 ? (

              <div className="cart-empty">

                <ShoppingCart size={50} />

                <h3>Your cart is empty</h3>

                <p>
                  Add some products to get started.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setCartOpen(false)
                  }
                >
                  Continue Shopping
                </button>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <img
                        src={
                          item.imageUrl ||
                          "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={item.productName}
                      />

                      <div className="cart-item-info">

                        <h4>
                          {item.productName}
                        </h4>

                        <p>
                          ₹
                          {Number(
                            item.unitPrice
                          ).toLocaleString("en-IN")}
                        </p>

                        <div className="cart-item-actions">

                          <div className="quantity-control">

                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                item.quantity <= 1
                              }
                            >
                              <Minus size={14} />
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >=
                                item.availableStock
                              }
                            >
                              <Plus size={14} />
                            </button>

                          </div>

                          <button
                            className="remove-button"
                            onClick={() =>
                              removeFromCart(item.id)
                            }
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                <div className="cart-footer">

                  <div className="cart-subtotal">

                    <span>Subtotal</span>

                    <strong>
                      ₹
                      {Number(
                        cartSubtotal
                      ).toLocaleString("en-IN")}
                    </strong>

                  </div>

                  <button
                    className="checkout-button"
                    onClick={checkout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading
                      ? "Processing..."
                      : "Proceed to Checkout"}

                    {!checkoutLoading && (
                      <ArrowRight size={18} />
                    )}
                  </button>

                  <button
                    className="clear-cart-button"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}

      {/* =========================
          MY ORDERS
      ========================= */}

      {ordersOpen && (

        <div
          className="cart-overlay"
          onClick={() => setOrdersOpen(false)}
        >

          <div
            className="orders-sidebar"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>

                <h2>My Orders</h2>

                <p>
                  {orders.length}{" "}
                  {orders.length === 1
                    ? "order"
                    : "orders"}
                </p>

              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="footer-link-button"
                  onClick={handleLogout}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "7px 10px",
                    background: "#fff"
                  }}
                >
                  Logout
                </button>

                <button
                  className="cart-close"
                  onClick={() =>
                    setOrdersOpen(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>

            </div>

            {ordersLoading ? (

              <div className="cart-empty">

                <PackageCheck size={45} />

                <h3>
                  Loading orders...
                </h3>

                <p>
                  Please wait.
                </p>

              </div>

            ) : orders.length === 0 ? (

              <div className="cart-empty">

                <PackageCheck size={50} />

                <h3>
                  No orders yet
                </h3>

                <p>
                  Your purchased products
                  will appear here.
                </p>

                <button
                  className="primary-button"
                  onClick={() => {
                    setOrdersOpen(false);
                    window.location.hash =
                      "products";
                  }}
                >
                  Start Shopping
                  <ArrowRight size={18} />
                </button>

              </div>

            ) : (

              <div className="orders-list">

                {orders.map((order) => (

                  <div
                    className="order-card"
                    key={order.orderId}
                  >

                    <div className="order-card-header">

                      <div>

                        <span>
                          ORDER #{order.orderId}
                        </span>

                        <small>
                          {new Date(
                            order.orderDate
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </small>

                      </div>

                      <strong>
                        ₹
                        {Number(
                          order.totalAmount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    <div className="order-status-row">

                      <span className="status-badge">
                        {order.status}
                      </span>

                      <span className="payment-badge">
                        {order.paymentStatus}
                      </span>

                    </div>

                    <div className="order-products">

                      {order.items.map((item) => (

                        <div
                          className="order-product"
                          key={item.productId}
                        >

                          <img
                            src={
                              item.imageUrl ||
                              "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=300&q=80"
                            }
                            alt={item.productName}
                          />

                          <div>

                            <h4>
                              {item.productName}
                            </h4>

                            <p>
                              Qty: {item.quantity}
                            </p>

                            <strong>
                              ₹
                              {Number(
                                item.unitPrice
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      )}

      {/* =========================
          PURCHASE SUCCESS
      ========================= */}

      {orderSuccess && (

        <div className="purchase-overlay">

          <div className="purchase-card">

            <div className="success-icon">
              <CheckCircle size={65} />
            </div>

            <p className="section-tag">
              ORDER CONFIRMED
            </p>

            <h1>
              Purchase Successful!
            </h1>

            <p className="purchase-description">
              Thank you for shopping with
              ShopSphere. Your order has been
              successfully placed.
            </p>

            <div className="order-summary">

              <div>
                <span>Order ID</span>

                <strong>
                  #{orderSuccess.orderId}
                </strong>
              </div>

              <div>
                <span>Total Amount</span>

                <strong>
                  ₹
                  {Number(
                    orderSuccess.totalAmount
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Payment</span>

                <strong>
                  {orderSuccess.paymentStatus}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {orderSuccess.status}
                </strong>
              </div>

            </div>

            <div className="purchase-delivery">

              <PackageCheck size={24} />

              <div>

                <strong>
                  Order is being processed
                </strong>

                <p>
                  You can view your order details
                  from your account.
                </p>

              </div>

            </div>

            <button
              className="primary-button purchase-button"
              onClick={() =>
                setOrderSuccess(null)
              }
            >
              Continue Shopping
              <ArrowRight size={18} />
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;