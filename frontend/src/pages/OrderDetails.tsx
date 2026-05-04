import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, Truck, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrderContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Pending' },
    confirmed: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Confirmed' },
    preparing: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Preparing' },
    ready: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Ready for Pickup' },
    delivered: { icon: Truck, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Cancelled' },
};

// ─── PDF Generator ────────────────────────────────────────────────────────────
const downloadOrderPDF = async (order: any) => {
    // Dynamically import jsPDF so it's only loaded when needed
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const col2 = pageW / 2;
    let y = 20;

    // ── Helpers ──────────────────────────────────────────────────────────────
    const line = (x1: number, y1: number, x2: number, y2: number, color = '#e5e7eb') => {
        doc.setDrawColor(color);
        doc.line(x1, y1, x2, y2);
    };

    const text = (
        str: string,
        x: number,
        yPos: number,
        opts: { size?: number; bold?: boolean; color?: string; align?: 'left' | 'center' | 'right' } = {}
    ) => {
        const { size = 10, bold = false, color = '#111827', align = 'left' } = opts;
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(color);
        doc.text(str, x, yPos, { align });
    };

    // ── Header Banner ────────────────────────────────────────────────────────
    doc.setFillColor('#16a34a'); // green-600
    doc.rect(0, 0, pageW, 36, 'F');

    text('Asian Basket', col2, 14, { size: 20, bold: true, color: '#ffffff', align: 'center' });
    text('asianbasket.ie', col2, 22, { size: 9, color: '#bbf7d0', align: 'center' });
    text('Order Invoice', col2, 30, { size: 10, color: '#d1fae5', align: 'center' });

    y = 46;

    // ── Order Meta ───────────────────────────────────────────────────────────
    text(order.id, margin, y, { size: 14, bold: true });
    text(
        `Placed: ${new Date(order.createdAt).toLocaleDateString('en-IE', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })}`,
        pageW - margin, y,
        { size: 9, color: '#6b7280', align: 'right' }
    );

    y += 6;
    const statusLabel = statusConfig[order.status as keyof typeof statusConfig]?.label ?? order.status;
    text(`Status: ${statusLabel}`, margin, y, { size: 9, color: '#6b7280' });

    y += 4;
    line(margin, y, pageW - margin, y);
    y += 8;

    // ── Customer & Delivery (two columns) ────────────────────────────────────
    const addr = order.deliveryAddress;

    // Left: Customer
    text('CUSTOMER', margin, y, { size: 8, bold: true, color: '#16a34a' });
    y += 6;
    text(addr.name ?? '—', margin, y, { size: 10, bold: true });
    y += 5;
    text(addr.phone ?? '—', margin, y, { size: 9, color: '#374151' });

    // Right: Delivery Address
    const addrX = col2 + 4;
    let addrY = y - 11;
    text('DELIVERY ADDRESS', addrX, addrY, { size: 8, bold: true, color: '#16a34a' });
    addrY += 6;
    text(addr.street ?? '—', addrX, addrY, { size: 9 });
    addrY += 5;
    const cityLine = [addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
    text(cityLine || '—', addrX, addrY, { size: 9 });

    y = Math.max(y, addrY) + 4;
    line(margin, y, pageW - margin, y);
    y += 8;

    // ── Items Table ──────────────────────────────────────────────────────────
    text('ORDERED ITEMS', margin, y, { size: 8, bold: true, color: '#16a34a' });
    y += 5;

    // Table header row
    doc.setFillColor('#f0fdf4');
    doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
    text('Item', margin + 2, y, { size: 9, bold: true });
    text('Qty', pageW - 60, y, { size: 9, bold: true, align: 'center' });
    text('Unit Price', pageW - 42, y, { size: 9, bold: true, align: 'right' });
    text('Total', pageW - margin, y, { size: 9, bold: true, align: 'right' });
    y += 6;
    line(margin, y, pageW - margin, y);
    y += 5;

    // Table rows
    for (const item of order.items) {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        text(item.name, margin + 2, y, { size: 9 });
        text(String(item.quantity), pageW - 60, y, { size: 9, align: 'center' });
        text(`€${item.price.toFixed(2)}`, pageW - 42, y, { size: 9, align: 'right' });
        text(`€${itemTotal}`, pageW - margin, y, { size: 9, align: 'right' });
        y += 6;
        line(margin, y - 1, pageW - margin, y - 1, '#f3f4f6');
    }

    y += 4;
    line(margin, y, pageW - margin, y);
    y += 6;

    // ── Totals ───────────────────────────────────────────────────────────────
    const subtotal = order.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const deliveryCharge = order.totalAmount - subtotal;

    if (deliveryCharge !== 0) {
        text('Subtotal', pageW - 60, y, { size: 9, color: '#6b7280', align: 'right' });
        text(`€${subtotal.toFixed(2)}`, pageW - margin, y, { size: 9, align: 'right' });
        y += 6;

        text('Delivery', pageW - 60, y, { size: 9, color: '#6b7280', align: 'right' });
        text(deliveryCharge > 0 ? `€${deliveryCharge.toFixed(2)}` : 'Free', pageW - margin, y, {
            size: 9,
            color: deliveryCharge > 0 ? '#111827' : '#16a34a',
            align: 'right',
        });
        y += 6;
    }

    // Grand total highlight box
    doc.setFillColor('#f0fdf4');
    doc.rect(pageW - 80, y - 5, 80 - margin + pageW - (pageW - 80), 10, 'F');
    text('TOTAL', pageW - 60, y + 1, { size: 11, bold: true, align: 'right' });
    text(`€${order.totalAmount.toFixed(2)}`, pageW - margin, y + 1, { size: 12, bold: true, color: '#16a34a', align: 'right' });
    y += 14;

    // ── Payment Info ─────────────────────────────────────────────────────────
    line(margin, y, pageW - margin, y);
    y += 7;
    text('PAYMENT', margin, y, { size: 8, bold: true, color: '#16a34a' });
    y += 5;
    const payLabel = order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1);
    const payColor = order.paymentStatus === 'paid' ? '#16a34a' : order.paymentStatus === 'failed' ? '#dc2626' : '#d97706';
    text(`Status: ${payLabel}`, margin, y, { size: 9, color: payColor });
    if (order.paymentId) {
        text(`Payment ID: ${order.paymentId}`, margin, y + 5, { size: 8, color: '#6b7280' });
        y += 5;
    }

    // ── Order Notes ──────────────────────────────────────────────────────────
    if (order.orderNotes) {
        y += 8;
        line(margin, y, pageW - margin, y);
        y += 7;
        text('ORDER NOTES', margin, y, { size: 8, bold: true, color: '#16a34a' });
        y += 5;
        const noteLines = doc.splitTextToSize(order.orderNotes, pageW - margin * 2);
        doc.setFontSize(9);
        doc.setTextColor('#374151');
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.internal.pageSize.getHeight() - 14;
    line(margin, footerY - 4, pageW - margin, footerY - 4);
    text('Thank you for shopping with Asian Basket! 🛒', col2, footerY, {
        size: 9, color: '#6b7280', align: 'center',
    });
    text('asianbasket.ie', col2, footerY + 5, { size: 8, color: '#16a34a', align: 'center' });

    // ── Save ─────────────────────────────────────────────────────────────────
    doc.save(`${order.id}-AsianBasket.pdf`);
};

// ─── Component ────────────────────────────────────────────────────────────────
const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { getOrderById } = useOrders();

    const order = id ? getOrderById(id) : undefined;

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="pt-[188px] md:pt-[200px] pb-16 px-4">
                    <div className="max-w-2xl mx-auto text-center py-12">
                        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            The order you're looking for doesn't exist or has been removed.
                        </p>
                        <Link to="/orders">
                            <Button>View All Orders</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const status = statusConfig[order.status];
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-[188px] md:pt-[200px] pb-16 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <Link to="/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>

                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">{order.id}</h1>
                            <p className="text-muted-foreground">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-IE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-full ${status.bg} ${status.color} flex items-center gap-2 font-semibold`}>
                                <StatusIcon className="h-5 w-5" />
                                {status.label}
                            </div>
                            {/* ── PDF Download Button ── */}
                            <Button
                                onClick={() => downloadOrderPDF(order)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="md:col-span-2">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{item.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Qty: {item.quantity} × €{item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary">
                                                        €{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Notes */}
                                    {order.orderNotes && (
                                        <div className="mt-6 pt-4 border-t">
                                            <h4 className="font-semibold mb-2">Order Notes</h4>
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                                {order.orderNotes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-6">
                            {/* Payment Info */}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CreditCard className="h-5 w-5" />
                                        Payment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' :
                                                order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                            </span>
                                        </div>
                                        {order.paymentId && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Payment ID</span>
                                                <span className="font-mono text-xs">{order.paymentId}</span>
                                            </div>
                                        )}
                                        <div className="pt-3 mt-3 border-t">
                                            <div className="flex justify-between">
                                                <span className="font-semibold">Total</span>
                                                <span className="font-bold text-lg text-primary">
                                                    €{order.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Delivery Address */}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <MapPin className="h-5 w-5" />
                                        Delivery Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold">{order.deliveryAddress.name}</p>
                                        <p className="text-muted-foreground">{order.deliveryAddress.phone}</p>
                                        <p className="text-muted-foreground">{order.deliveryAddress.street}</p>
                                        <p className="text-muted-foreground">
                                            {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="space-y-2">
                                {/* PDF Download (mobile-friendly repeat) */}
                                <Button
                                    onClick={() => downloadOrderPDF(order)}
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Invoice PDF
                                </Button>
                                <Link to="/#menu" className="block">
                                    <Button className="w-full bg-primary hover:bg-primary/90">
                                        Order Again
                                    </Button>
                                </Link>
                                <Link to="/orders" className="block">
                                    <Button variant="outline" className="w-full">
                                        Back to Orders
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderDetails;
