import "./Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <div className="app-footer-brand">
          <div className="app-footer-logo">TF</div>

          <div>
            <h3>TicketFlow</h3>
            <p>
              Manage tickets, assignments, workflows, and support requests
              efficiently.
            </p>
          </div>
        </div>

        <div className="app-footer-right">
          <span>© {new Date().getFullYear()} TicketFlow</span>

          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
