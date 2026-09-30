// "use client";

// import { useState } from "react";
// import { useQuery, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { useUser } from "@clerk/nextjs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   AlertCircle,
//   CheckCircle2,
//   XCircle,
//   Loader2,
//   DollarSign,
//   Users,
//   Calendar,
//   RefreshCw,
// } from "lucide-react";
// import { formatCurrency } from "@/lib/utils";
// import { Id } from "@/convex/_generated/dataModel";

// export default function AdminDashboard() {
//   const { user } = useUser();
//   if (user) {
//     console.log("=== ADMIN DEBUG ===");
//     console.log("User ID:", user.id);
//     console.log("Public Metadata:", user.publicMetadata);
//     console.log("Role:", user.publicMetadata?.role);
//     console.log("==================");
//   }
//   const [selectedBooking, setSelectedBooking] = useState<any>(null);
//   const [showDetailsDialog, setShowDetailsDialog] = useState(false);
//   const [actionDialog, setActionDialog] = useState<{
//     open: boolean;
//     type: "approve" | "reject" | null;
//     booking: any;
//   }>({ open: false, type: null, booking: null });
//   const [isProcessing, setIsProcessing] = useState(false);

//   // Queries
//   const allBookings = useQuery(api.bookings.getAllBookingsForAdmin);
//   const pendingRefunds = useQuery(api.bookings.getPendingRefunds);

//   // Mutations
//   const approveRefund = useMutation(api.bookings.approveRefund);
//   const rejectRefund = useMutation(api.bookings.rejectRefund);

//   // Format time
//   const formatTime = (time: string) => {
//     const [hours, minutes] = time.split(":").map(Number);
//     const period = hours >= 12 ? "PM" : "AM";
//     const displayHours = hours % 12 || 12;
//     return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
//   };

//   // Handle approve refund
//   const handleApproveRefund = async (booking: any) => {
//     setIsProcessing(true);
//     try {
//       // First approve in database
//       await approveRefund({ bookingId: booking._id });

//       // Then process Stripe refund
//       const response = await fetch("/api/process-refund", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           bookingId: booking._id,
//           paymentIntentId: booking.paymentId,
//           amount: booking.refundAmount,
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         alert("Refund approved and processed successfully!");
//       } else {
//         alert(
//           "Refund approved but Stripe processing failed. Please check Stripe dashboard.",
//         );
//       }

//       setActionDialog({ open: false, type: null, booking: null });
//     } catch (error) {
//       console.error("Error approving refund:", error);
//       alert("Failed to approve refund");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Handle reject refund
//   const handleRejectRefund = async (booking: any) => {
//     setIsProcessing(true);
//     try {
//       await rejectRefund({ bookingId: booking._id });
//       alert("Refund rejected successfully");
//       setActionDialog({ open: false, type: null, booking: null });
//     } catch (error) {
//       console.error("Error rejecting refund:", error);
//       alert("Failed to reject refund");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Statistics
//   const stats = {
//     totalBookings: allBookings?.length || 0,
//     pendingRefunds: pendingRefunds?.length || 0,
//     totalRefundAmount:
//       pendingRefunds?.reduce((sum, b) => sum + (b.refundAmount || 0), 0) || 0,
//     cancelledBookings:
//       allBookings?.filter((b) => b.status === "cancelled").length || 0,
//   };

//   const getStatusBadge = (status: string) => {
//     const variants: Record<string, { color: string; icon: any }> = {
//       pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
//       approved: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
//       rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
//       processed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
//     };

//     const variant = variants[status] || variants.pending;
//     const Icon = variant.icon;

//     return (
//       <Badge className={variant.color}>
//         <Icon className="w-3 h-3 mr-1" />
//         {status}
//       </Badge>
//     );
//   };

//   if (!user) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <Card>
//           <CardContent className="flex items-center justify-center py-12">
//             <Loader2 className="w-8 h-8 animate-spin" />
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
//         <p className="text-muted-foreground">
//           Manage bookings and refund requests
//         </p>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Bookings</p>
//                 <p className="text-2xl font-bold">{stats.totalBookings}</p>
//               </div>
//               <Calendar className="w-8 h-8 text-blue-600 opacity-50" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Pending Refunds</p>
//                 <p className="text-2xl font-bold text-yellow-600">
//                   {stats.pendingRefunds}
//                 </p>
//               </div>
//               <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Refund Amount</p>
//                 <p className="text-2xl font-bold text-orange-600">
//                   {formatCurrency(stats.totalRefundAmount)}
//                 </p>
//               </div>
//               <DollarSign className="w-8 h-8 text-orange-600 opacity-50" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Cancelled</p>
//                 <p className="text-2xl font-bold text-red-600">
//                   {stats.cancelledBookings}
//                 </p>
//               </div>
//               <XCircle className="w-8 h-8 text-red-600 opacity-50" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Tabs */}
//       <Tabs defaultValue="pending" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="pending">
//             Pending Refunds
//             {stats.pendingRefunds > 0 && (
//               <Badge className="ml-2 bg-yellow-600">
//                 {stats.pendingRefunds}
//               </Badge>
//             )}
//           </TabsTrigger>
//           <TabsTrigger value="all">All Bookings</TabsTrigger>
//           <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
//         </TabsList>

//         {/* Pending Refunds Tab */}
//         <TabsContent value="pending">
//           <Card>
//             <CardHeader>
//               <CardTitle>Pending Refund Requests</CardTitle>
//               <CardDescription>
//                 Review and approve/reject refund requests
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               {!pendingRefunds ? (
//                 <div className="flex justify-center py-8">
//                   <Loader2 className="w-8 h-8 animate-spin" />
//                 </div>
//               ) : pendingRefunds.length === 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No pending refund requests
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Booking ID</TableHead>
//                         <TableHead>User</TableHead>
//                         <TableHead>Turf</TableHead>
//                         <TableHead>Date</TableHead>
//                         <TableHead>Amount</TableHead>
//                         <TableHead>Reason</TableHead>
//                         <TableHead>Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {pendingRefunds.map((booking) => (
//                         <TableRow key={booking._id}>
//                           <TableCell className="font-mono text-xs">
//                             #{booking._id.slice(-8)}
//                           </TableCell>
//                           <TableCell>
//                             <div>
//                               <p className="font-medium">{booking.userName}</p>
//                               <p className="text-xs text-muted-foreground">
//                                 {booking.userEmail}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell>{booking.turfName}</TableCell>
//                           <TableCell>
//                             {new Date(booking.date).toLocaleDateString()}
//                           </TableCell>
//                           <TableCell className="font-semibold">
//                             {formatCurrency(booking.refundAmount || 0)}
//                           </TableCell>
//                           <TableCell>
//                             <Button
//                               variant="link"
//                               className="p-0 h-auto"
//                               onClick={() => {
//                                 setSelectedBooking(booking);
//                                 setShowDetailsDialog(true);
//                               }}
//                             >
//                               View Details
//                             </Button>
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex gap-2">
//                               <Button
//                                 size="sm"
//                                 variant="default"
//                                 className="bg-green-600 hover:bg-green-700"
//                                 onClick={() =>
//                                   setActionDialog({
//                                     open: true,
//                                     type: "approve",
//                                     booking,
//                                   })
//                                 }
//                               >
//                                 <CheckCircle2 className="w-4 h-4 mr-1" />
//                                 Approve
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="destructive"
//                                 onClick={() =>
//                                   setActionDialog({
//                                     open: true,
//                                     type: "reject",
//                                     booking,
//                                   })
//                                 }
//                               >
//                                 <XCircle className="w-4 h-4 mr-1" />
//                                 Reject
//                               </Button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* All Bookings Tab */}
//         <TabsContent value="all">
//           <Card>
//             <CardHeader>
//               <CardTitle>All Bookings</CardTitle>
//               <CardDescription>Complete booking history</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {!allBookings ? (
//                 <div className="flex justify-center py-8">
//                   <Loader2 className="w-8 h-8 animate-spin" />
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>ID</TableHead>
//                         <TableHead>User</TableHead>
//                         <TableHead>Turf</TableHead>
//                         <TableHead>Date & Time</TableHead>
//                         <TableHead>Amount</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead>Refund Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {allBookings.slice(0, 50).map((booking) => (
//                         <TableRow key={booking._id}>
//                           <TableCell className="font-mono text-xs">
//                             #{booking._id.slice(-6)}
//                           </TableCell>
//                           <TableCell>
//                             <div>
//                               <p className="font-medium text-sm">
//                                 {booking.userName}
//                               </p>
//                               <p className="text-xs text-muted-foreground">
//                                 {booking.userEmail}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell>{booking.turfName}</TableCell>
//                           <TableCell>
//                             <div>
//                               <p className="text-sm">
//                                 {new Date(booking.date).toLocaleDateString()}
//                               </p>
//                               <p className="text-xs text-muted-foreground">
//                                 {formatTime(booking.startTime)} -{" "}
//                                 {formatTime(booking.endTime)}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell className="font-semibold">
//                             {formatCurrency(booking.totalPrice)}
//                           </TableCell>
//                           <TableCell>
//                             <Badge
//                               variant={
//                                 booking.status === "confirmed"
//                                   ? "default"
//                                   : booking.status === "cancelled"
//                                     ? "destructive"
//                                     : "secondary"
//                               }
//                             >
//                               {booking.status}
//                             </Badge>
//                           </TableCell>
//                           <TableCell>
//                             {booking.refundStatus
//                               ? getStatusBadge(booking.refundStatus)
//                               : "-"}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Cancelled Bookings Tab */}
//         <TabsContent value="cancelled">
//           <Card>
//             <CardHeader>
//               <CardTitle>Cancelled Bookings</CardTitle>
//               <CardDescription>View all cancelled bookings</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {!allBookings ? (
//                 <div className="flex justify-center py-8">
//                   <Loader2 className="w-8 h-8 animate-spin" />
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>ID</TableHead>
//                         <TableHead>User</TableHead>
//                         <TableHead>Turf</TableHead>
//                         <TableHead>Date</TableHead>
//                         <TableHead>Amount</TableHead>
//                         <TableHead>Reason</TableHead>
//                         <TableHead>Refund Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {allBookings
//                         .filter((b) => b.status === "cancelled")
//                         .map((booking) => (
//                           <TableRow key={booking._id}>
//                             <TableCell className="font-mono text-xs">
//                               #{booking._id.slice(-6)}
//                             </TableCell>
//                             <TableCell>{booking.userName}</TableCell>
//                             <TableCell>{booking.turfName}</TableCell>
//                             <TableCell>
//                               {new Date(booking.date).toLocaleDateString()}
//                             </TableCell>
//                             <TableCell className="font-semibold">
//                               {formatCurrency(booking.totalPrice)}
//                             </TableCell>
//                             <TableCell>
//                               <Button
//                                 variant="link"
//                                 className="p-0 h-auto text-xs"
//                                 onClick={() => {
//                                   setSelectedBooking(booking);
//                                   setShowDetailsDialog(true);
//                                 }}
//                               >
//                                 View
//                               </Button>
//                             </TableCell>
//                             <TableCell>
//                               {booking.refundStatus
//                                 ? getStatusBadge(booking.refundStatus)
//                                 : "-"}
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Details Dialog */}
//       <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Cancellation Details</DialogTitle>
//           </DialogHeader>

//           {selectedBooking && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Booking ID</p>
//                   <p className="font-mono">#{selectedBooking._id.slice(-8)}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Refund Amount</p>
//                   <p className="font-bold text-lg">
//                     {formatCurrency(selectedBooking.refundAmount || 0)}
//                   </p>
//                 </div>
//               </div>

//               <div>
//                 <p className="text-sm text-muted-foreground mb-1">
//                   Cancellation Reason
//                 </p>
//                 <Badge>{selectedBooking.cancellationReason}</Badge>
//               </div>

//               <div>
//                 <p className="text-sm text-muted-foreground mb-2">
//                   Detailed Explanation
//                 </p>
//                 <div className="p-4 bg-muted rounded-lg">
//                   <p className="text-sm">
//                     {selectedBooking.cancellationDetails}
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Cancelled At</p>
//                   <p className="text-sm">
//                     {selectedBooking.cancelledAt
//                       ? new Date(selectedBooking.cancelledAt).toLocaleString()
//                       : "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Refund Status</p>
//                   {selectedBooking.refundStatus &&
//                     getStatusBadge(selectedBooking.refundStatus)}
//                 </div>
//               </div>
//             </div>
//           )}

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setShowDetailsDialog(false)}
//             >
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Action Confirmation Dialog */}
//       <Dialog
//         open={actionDialog.open}
//         onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               {actionDialog.type === "approve"
//                 ? "Approve Refund"
//                 : "Reject Refund"}
//             </DialogTitle>
//             <DialogDescription>
//               {actionDialog.type === "approve"
//                 ? "This will process the refund through Stripe and mark it as approved."
//                 : "This will reject the refund request and the booking will remain cancelled without refund."}
//             </DialogDescription>
//           </DialogHeader>

//           {actionDialog.booking && (
//             <div className="space-y-2 py-4">
//               <div className="p-4 bg-muted rounded-lg">
//                 <p className="font-semibold">{actionDialog.booking.userName}</p>
//                 <p className="text-sm">{actionDialog.booking.turfName}</p>
//                 <p className="text-sm font-bold mt-2">
//                   Amount:{" "}
//                   {formatCurrency(actionDialog.booking.refundAmount || 0)}
//                 </p>
//               </div>
//             </div>
//           )}

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() =>
//                 setActionDialog({ open: false, type: null, booking: null })
//               }
//               disabled={isProcessing}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant={
//                 actionDialog.type === "approve" ? "default" : "destructive"
//               }
//               onClick={() => {
//                 if (actionDialog.type === "approve") {
//                   handleApproveRefund(actionDialog.booking);
//                 } else {
//                   handleRejectRefund(actionDialog.booking);
//                 }
//               }}
//               disabled={isProcessing}
//             >
//               {isProcessing ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : actionDialog.type === "approve" ? (
//                 "Approve & Process Refund"
//               ) : (
//                 "Reject Refund"
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// // "use client";

// // import { useUser } from "@clerk/nextjs";

// // export default function AdminDashboard() {
// //   const { user } = useUser();

// //   console.log("=== ADMIN PAGE LOADED ===");
// //   console.log("User:", user?.id);
// //   console.log("Metadata:", user?.publicMetadata);
// //   console.log("========================");

// //   return (
// //     <div className="container mx-auto px-4 py-8">
// //       <h1 className="text-4xl font-bold">ADMIN DASHBOARD</h1>
// //       <p className="mt-4">User ID: {user?.id}</p>
// //       <p>Role: {user?.publicMetadata?.role as string}</p>
// //       <pre className="mt-4 p-4 bg-gray-100 rounded">
// //         {JSON.stringify(user?.publicMetadata, null, 2)}
// //       </pre>
// //     </div>
// //   );
// // }